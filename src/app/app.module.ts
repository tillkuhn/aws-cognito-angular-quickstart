import {BrowserModule, BrowserTransferStateModule, TransferState} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {HttpClientModule} from '@angular/common/http';
import {AppComponent} from './app.component';
import {UserRegistrationService} from './service/user-registration.service';
import {UserParametersService} from './service/user-parameters.service';
import {UserLoginService} from './service/user-login.service';
import {CognitoUtil} from './service/cognito.service';
import {routing} from './app.routes';
import {AboutComponent, HomeComponent, HomeLandingComponent} from './public/home.component';
import {AwsUtil} from './service/aws.service';
import {UseractivityComponent} from './secure/useractivity/useractivity.component';
import {MyProfileComponent} from './secure/profile/myprofile.component';
import {SecureHomeComponent} from './secure/landing/secureHome.component';
import {JwtComponent} from './secure/jwttokens/jwt.component';
import {DynamoDBService, DynamoDBUtil} from './service/ddb.service';
import {LoginComponent} from './public/auth/login/login.component';
import {RegisterComponent} from './public/auth/register/registration.component';
import {ForgotPassword2Component, ForgotPasswordStep1Component} from './public/auth/forgot/forgotPassword.component';
import {LogoutComponent, RegistrationConfirmationComponent} from './public/auth/confirm/confirmRegistration.component';
import {ResendCodeComponent} from './public/auth/resend/resendCode.component';
import {NewPasswordComponent} from './public/auth/newpassword/newpassword.component';
import {MFAComponent} from './public/auth/mfa/mfa.component';
import {DishesComponent} from './secure/dishes/dishes.component';
import {DishService} from './service/dish.service';
import {DishDetailComponent} from './secure/dish-detail/dish-detail.component';
import {LocationService} from './service/location.service';
import {TagInputModule} from 'ngx-chips';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {BarRatingModule} from 'ngx-bar-rating';
import {NgProgressModule} from '@ngx-progressbar/core';
import {ToastrModule} from 'ngx-toastr';
import {LoggerModule, NgxLoggerLevel} from 'ngx-logger';
import {NgxDatatableModule} from '@swimlane/ngx-datatable';
import {CacheModule, CACHE} from '@ngx-cache/core';
import {BrowserCacheModule, MemoryCacheService} from '@ngx-cache/platform-browser';
import {LocationsComponent} from './secure/locations/locations.component';
import {LocationMapComponent} from './secure/location-map/location-map.component';
import {LocationDetailComponent} from './secure/places/location-detail.component';
import {RegionsComponent} from './secure/locations/regions.component';
import {S3Service} from './service/s3.service';
import {ApigateService} from './service/apigate.service';
import {NgxUploaderModule} from 'ngx-uploader';
import {MyDatePickerModule} from 'mydatepicker';
import {NgxTreeSelectModule, TreeSelectDefaultOptions} from 'ngx-tree-select';
import {LocationStrategy, HashLocationStrategy} from '@angular/common';

// import { BrowserCacheModule, LocalStorageCacheService } from '@ngx-cache/platform-browser';

@NgModule({
    declarations: [
        NewPasswordComponent,
        LoginComponent,
        LogoutComponent,
        RegistrationConfirmationComponent,
        ResendCodeComponent,
        ForgotPasswordStep1Component,
        ForgotPassword2Component,
        RegisterComponent,
        MFAComponent,
        AboutComponent,
        HomeLandingComponent,
        HomeComponent,
        UseractivityComponent,
        MyProfileComponent,
        SecureHomeComponent,
        JwtComponent,
        AppComponent,
        DishesComponent,
        DishDetailComponent,
        LocationsComponent,
        LocationMapComponent,
        LocationDetailComponent,
        RegionsComponent
    ],
    imports: [
        BrowserModule,
        FormsModule,
        ReactiveFormsModule,
        HttpClientModule,
        TagInputModule,
        BarRatingModule,
        NgxDatatableModule,
        BrowserAnimationsModule, // required animations module
        ToastrModule.forRoot(), // ToastrModule added
        CacheModule.forRoot(),
        BrowserCacheModule.forRoot([
            {
                provide: CACHE,
                useClass: MemoryCacheService // or, LocalStorageCacheService
            }
        ]),
        LoggerModule.forRoot({level: NgxLoggerLevel.DEBUG}),
        NgProgressModule.forRoot({
            spinnerPosition: 'right',
            color: '#f71cff',
            thick: true
        }),
        // NgProgressHttpModule.forRoot(),
        NgxUploaderModule,
        MyDatePickerModule,
        NgxTreeSelectModule.forRoot({allowFilter: true, expandMode: 'All'}),
        routing
    ],
    providers: [
        CognitoUtil,
        DynamoDBUtil,
        AwsUtil,
        DynamoDBService,
        UserRegistrationService,
        UserLoginService,
        DishService,
        S3Service,
        ApigateService,
        LocationService,
        TransferState,
        UserParametersService,
        // https://www.heise.de/developer/artikel/LocationStrategy-fuer-den-Angular-2-Router-aendern-3457321.html
        {provide: LocationStrategy, useClass: HashLocationStrategy}
    ],
    bootstrap: [AppComponent]
})
export class AppModule {
}
