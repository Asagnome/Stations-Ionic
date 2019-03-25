import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';
import { BluetoothSerial } from '@ionic-native/bluetooth-serial/ngx';
import { BehaviorSubject } from "rxjs";

import { Station } from '../../models/station';
import {ConnectionsProvider} from "../connections/connections";

@Injectable()
export class Stations {
  stations: Station[];
  stationsSubject: BehaviorSubject<Station[]> = new BehaviorSubject([]);
  connectedStations = [];
  connectedStationsSubject: BehaviorSubject<Station[]> = new BehaviorSubject([]);
  availableDevices = [];
  availableStationsSubject: BehaviorSubject<Station[]> = new BehaviorSubject([]);
  appState = { isActive: true };

  constructor(public storage: Storage, public bluetooth: BluetoothSerial, public connections: ConnectionsProvider) {
    document.addEventListener('pause', () => this.appState.isActive = false);
    document.addEventListener('resume', () => this.appState.isActive = true);

    this.getStored().then((storedStations => {
      storedStations.forEach((station, index, array) => array[index].bluetoothConnected = false);
      this.stations = storedStations;
      this.stationsSubject.next(storedStations);
      this.stationsSubject.subscribe({
        next: function (stations) {
          this.connectedStations = stations.filter(station => station.bluetoothConnected);
          this.connectedStationsSubject.next(this.connectedStations);
        }.bind(this)
      });
    }));

    connections.watchForIncomingData({
      next: (data) => {
        if (data.route) {
          if (data.route === 'Station/get' || data.route === 'Station/set') {
            if (data.stationId) {
              let station = this.stations.find((station) => station.address === data.address);
              delete data.data.route;
              delete data.data.address;
              station = {...station, ...data.data};
              console.log(station)
              this.upsert(station);
            }
          }
        }
      }
    });

    this.scanBluetooth();
  }

  setAvailableDevices() {
    const availableDevices = this.availableDevices.filter((device) => {
      return !this.connectedStations.find((station) => device.id === station.id);
    });
    this.availableStationsSubject.next(availableDevices);
  }

  scanBluetooth() {
    this.bluetooth.enable()
      .then(() => {
          this.bluetooth.discoverUnpaired()
            .then(devices => {
              this.availableDevices = devices;
              this.setAvailableDevices();
              if (this.appState.isActive) {
                this.scanBluetooth();
              }
            })
            .catch(error => console.error(error));
        }
      )
      .catch(error => console.error(error));
  }

  connectBluetooth(station: Station) {
    const deviceConnection = this.bluetooth.connect(station.address);
    return new Promise((resolve, reject) => {
      deviceConnection.subscribe({
        next: function() {
          station.bluetoothConnected = true;
          this.connections.send({
            route: 'Station/get',
            address: station.address
          });
          this.upsert(station);
          this.setAvailableDevices();
          resolve(true);
        }.bind(this),
        error: function(error) {
          station.bluetoothConnected = false;
          this.upsert(station);
          reject(error);
        }.bind(this)
      });
    });
  }

  disconnectBluetooth(station) {
    this.bluetooth.disconnect()
      .then(_ => {
        station.bluetoothConnected = false;
        this.upsert(station);
        this.setAvailableDevices();
      });
  }

  watchConnected(observer) {
    this.connectedStationsSubject.subscribe(observer);
    return { unsubscribe: this.connectedStationsSubject.unsubscribe };
  }

  watchAvailable(observer) {
    this.availableStationsSubject.subscribe(observer);
    return { unsubscribe: this.availableStationsSubject.unsubscribe };
  }

  upsert(station: Station) {
    let index = this.stations.indexOf(this.find(station.address));
    if (index === -1) {
      this.stations.push(station);
    } else {
      this.stations[index] = station;
    }

    this.stationsSubject.next(this.stations);
    this.storage.set('stations', JSON.stringify(this.stations));
  }

  getStored() {
    return this.storage.get('stations')
      .then(stations => {
        return JSON.parse(stations) || [];
      });
  }

  find(address: string) {
    return this.stations.find(station => station.address === address);
  }

  delete(station: Station) {
    this.stations.splice(this.stations.indexOf(station), 1);
    this.stationsSubject.next(this.stations);
    this.storage.set('stations', JSON.stringify(this.stations));
    return this.stations;
  }
}
