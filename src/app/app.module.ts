import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { registerLocaleData } from '@angular/common';
import en from '@angular/common/locales/en';
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HttpClientModule } from '@angular/common/http';

import { MensHelpComponent } from './mens-help/mens-help.component';
import { WhoIAmComponent } from './who-i-am/who-i-am.component';
import { HeaderComponent } from './shared/header.component';
import { RelationshipGuideComponent } from './relationship-guide/relationship-guide.component';
import { SurrenderComponent } from './surrender/surrender.component';
import { PrayerComponent } from './prayer/prayer.component';
import { ScriptureVersesComponent } from './shared/scripture-verses/scripture-verses.component';
import { TextSizeSliderComponent } from './shared/text-size-slider/text-size-slider.component';
import { GrowthSelectionComponent } from './features/growth/growth-selection.component';
import { GrowthDetailComponent } from './features/growth/growth-detail.component';
import { GrowthVersesComponent } from './features/growth/growth-verses.component';
import { ParentBlessingsSelectionComponent } from './features/parent-blessings/parent-blessings-selection.component';
import { ParentBlessingsDetailComponent } from './features/parent-blessings/parent-blessings-detail.component';
import { ParentBlessingsVersesComponent } from './features/parent-blessings/parent-blessings-verses.component';
import { FaithScrollComponent } from './faith-scroll/faith-scroll.component';
import { DonateComponent } from './donate/donate.component';

import { NZ_I18N, en_US } from 'ng-zorro-antd/i18n';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
// NzPageHeaderModule removed (not used in templates)
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzDividerModule } from 'ng-zorro-antd/divider';
// NzSelectModule removed (not used in templates)
import { NZ_ICONS } from 'ng-zorro-antd/icon';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzSliderModule } from 'ng-zorro-antd/slider';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
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
  ArrowLeftOutline,
  ReloadOutline,
  CheckCircleFill,
  MenuOutline,
  CloseOutline,
  UnlockOutline,
  BookOutline,
  BulbOutline,
  ShareAltOutline
} from '@ant-design/icons-angular/icons';

registerLocaleData(en);

@NgModule({
  declarations: [
    AppComponent,
    MensHelpComponent,
    WhoIAmComponent,
    HeaderComponent,
    RelationshipGuideComponent,
    SurrenderComponent,
    PrayerComponent,
    ScriptureVersesComponent,
    TextSizeSliderComponent,
    GrowthSelectionComponent,
    GrowthDetailComponent,
    GrowthVersesComponent,
    ParentBlessingsSelectionComponent,
    ParentBlessingsDetailComponent,
    ParentBlessingsVersesComponent,
    FaithScrollComponent,
    DonateComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    NzButtonModule,
    NzCardModule,
    NzGridModule,
    NzIconModule,
    NzDividerModule,
    NzAlertModule,
    NzSpinModule,
    NzModalModule,
    NzSliderModule,
    NzBreadCrumbModule,
    NzPaginationModule
  ],
  providers: [{ provide: NZ_I18N, useValue: en_US }, { provide: NZ_ICONS, useValue: [
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
      LockOutline
      ,
      ArrowLeftOutline,
      ReloadOutline,
      CheckCircleFill,
      MenuOutline,
      CloseOutline,
      UnlockOutline,
      BookOutline,
      BulbOutline,
      ShareAltOutline
  ] as IconDefinition[] }],
  bootstrap: [AppComponent]
})
export class AppModule { }
