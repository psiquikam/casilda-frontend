import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'app-public-footer',
    imports: [CommonModule, MatIconModule],
    templateUrl: './public-footer.component.html',
    styleUrls: ['./public-footer.component.scss']
})
export class PublicFooterComponent {}