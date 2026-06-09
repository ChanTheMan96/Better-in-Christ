import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { registerLocaleData } from '@angular/common';
import en from '@angular/common/locales/en';
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { provideHttpClient, withInterceptorsFromDi, withXhr } from '@angular/common/http';

import { EmotionsComponent } from './emotions/emotions.component';
import { WhoIAmComponent } from './who-i-am/who-i-am.component';
import { HeaderComponent } from './shared/header.component';
import { RelationshipGuideComponent } from './relationship-guide/relationship-guide.component';
import { SurrenderComponent } from './surrender/surrender.component';
import { PrayerComponent } from './prayer/prayer.component';
import { DonateComponent } from './donate/donate.component';
import { ContactComponent } from './contact/contact.component';
import { SharedModule } from './shared/shared.module';

import { NZ_I18N, en_US } from 'ng-zorro-antd/i18n';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NZ_ICONS } from 'ng-zorro-antd/icon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { IconDefinition } from '@ant-design/icons-angular';
import {
  AimOutline,
  AlertOutline,
  BarChartOutline,
  ClockCircleOutline,
  CloudOutline,
  ClusterOutline,
  ExclamationCircleOutline,
  FrownOutline,
  FireOutline,
  CrownOutline,
  UserOutline,
  CompassOutline,
  WarningOutline,
  HeartFill,
  HeartOutline,
  CloseCircleOutline,
  ExclamationOutline,
  EyeOutline,
  WalletOutline,
  QuestionCircleOutline,
  EyeInvisibleOutline,
  MehOutline,
  SafetyCertificateOutline,
  ShakeOutline,
  StarOutline,
  StopOutline,
  TeamOutline,
  LockOutline,
  ReloadOutline,
  CloseOutline,
  UnlockOutline,
  BookOutline,
  BulbOutline,
  ShareAltOutline
} from '@ant-design/icons-angular/icons';

registerLocaleData(en);

@NgModule({ declarations: [
        AppComponent,
        EmotionsComponent,
        WhoIAmComponent,
        HeaderComponent,
        RelationshipGuideComponent,
        SurrenderComponent,
        PrayerComponent,
        DonateComponent,
        ContactComponent
    ],
    bootstrap: [AppComponent], imports: [BrowserModule,
        BrowserAnimationsModule,
        AppRoutingModule,
        FormsModule,
        SharedModule,
        NzButtonModule,
        NzCardModule,
        NzGridModule,
        NzIconModule,
        NzSpinModule,
        NzModalModule,
        NzBreadCrumbModule], providers: [
        { provide: NZ_I18N, useValue: en_US },
        {
            provide: NZ_ICONS,
            useValue: [
                AimOutline,
                AlertOutline,
                BarChartOutline,
                ClockCircleOutline,
                CloudOutline,
                ClusterOutline,
                ExclamationCircleOutline,
                FrownOutline,
                FireOutline,
                CrownOutline,
                UserOutline,
                CompassOutline,
                WarningOutline,
                HeartFill,
                HeartOutline,
                CloseCircleOutline,
                ExclamationOutline,
                EyeOutline,
                WalletOutline,
                QuestionCircleOutline,
                EyeInvisibleOutline,
                MehOutline,
                SafetyCertificateOutline,
                ShakeOutline,
                StarOutline,
                StopOutline,
                TeamOutline,
                LockOutline,
                ReloadOutline,
                CloseOutline,
                UnlockOutline,
                BookOutline,
                BulbOutline,
                ShareAltOutline
            ] as IconDefinition[]
        },
        provideHttpClient(withXhr(), withInterceptorsFromDi())
    ] })
export class AppModule { }
