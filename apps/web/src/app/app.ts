import { Component } from '@angular/core';

import { MapWorkbench } from './map-workbench/map-workbench';

@Component({
  selector: 'app-root',
  imports: [MapWorkbench],
  templateUrl: './app.html',
})
export class App {}
