import * as BABYLON from 'babylonjs';
import 'babylonjs-loaders';
import 'babylonjs-gui';
import { Game } from './game/Game';
import { defaultConfig } from './config/gameConfig';

const canvas = document.getElementById('game') as HTMLCanvasElement;
const engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true, doNotHandleContextLost: true });

const game = new Game(engine, defaultConfig);
game.start();
