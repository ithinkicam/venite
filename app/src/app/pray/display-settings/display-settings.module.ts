import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { IonicModule } from "@ionic/angular";
import { TranslateModule } from "@ngx-translate/core";
import { DisplaySettingsComponent } from "./display-settings.component";

@NgModule({
  declarations: [DisplaySettingsComponent],
  imports: [CommonModule, FormsModule, IonicModule, TranslateModule],
  exports: [DisplaySettingsComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class DisplaySettingsModule {}
