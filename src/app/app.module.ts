import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ErrorHandler, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BluetoothSerial } from '@ionic-native/bluetooth-serial/ngx';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { IonicStorageModule, Storage } from '@ionic/storage';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';

import { Settings, User, Api, Stations, StationsDataProvider } from '../providers';
import { ComponentsModule } from "../components/components.module";
import { StationsApp } from './app.component';
import { PopoverComponent } from "../components/popover/popover";
import { ConnectWifiComponent } from "../components/connect-wifi/connect-wifi";
import { ConnectionsProvider } from '../providers/connections/connections';

// The translate loader needs to know where to load i18n files
// in Ionic's static asset pipeline.
export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

export function provideSettings(storage: Storage) {
  return new Settings(storage, {
    option1: true,
    option2: 'Ionitron J. Framework',
    option3: '3',
    option4: 'Hello'
  });
}


@NgModule({
  declarations: [
    StationsApp
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    ComponentsModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: (createTranslateLoader),
        deps: [HttpClient]
      }
    }),
    IonicModule.forRoot(StationsApp),
    IonicStorageModule.forRoot({
      driverOrder: ['localstorage', 'indexeddb', 'sqlite', 'websql']
    })
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    StationsApp,
    PopoverComponent,
    ConnectWifiComponent
  ],
  providers: [
    Api,
    User,
    BluetoothSerial,
    SplashScreen,
    StatusBar,
    Stations,
    StationsDataProvider,
    { provide: Settings, useFactory: provideSettings, deps: [Storage] },
    ConnectionsProvider,
    // Keep this to enable Ionic's runtime error handling during development
    { provide: ErrorHandler, useClass: IonicErrorHandler }
  ]
})
export class AppModule { }
