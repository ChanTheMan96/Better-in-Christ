import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { registerLocaleData } from '@angular/common';
import en from '@angular/common/locales/en';
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';

import { HeaderComponent } from './shared/header.component';
import { DonateComponent } from './donate/donate.component';
import { ContactComponent } from './contact/contact.component';

import { NZ_I18N, en_US } from 'ng-zorro-antd/i18n';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NZ_ICONS } from 'ng-zorro-antd/icon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { IconDefinition } from '@ant-design/icons-angular';
import {
  HeartFill,
  HeartOutline,
  AuditOutline,
  LoginOutline,
  LogoutOutline,
  ReloadOutline,
  CloseOutline,
  BookOutline,
  ShareAltOutline,
} from '@ant-design/icons-angular/icons';

registerLocaleData(en);

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    DonateComponent,
    ContactComponent,
  ],
  bootstrap: [AppComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    FormsModule,
    NzButtonModule,
    NzIconModule,
    NzSpinModule,
    NzModalModule,
  ],
  providers: [
    { provide: NZ_I18N, useValue: en_US },
    {
      provide: NZ_ICONS,
      useValue: [
        HeartFill,
        HeartOutline,
        AuditOutline,
        LoginOutline,
        LogoutOutline,
        ReloadOutline,
        CloseOutline,
        BookOutline,
        ShareAltOutline,
      ] as IconDefinition[],
    },
    provideHttpClient(withInterceptorsFromDi()),
  ],
})
export class AppModule {}
