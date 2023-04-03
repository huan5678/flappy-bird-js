import './index.css'
import {FlappyBird} from './game';
document.querySelector('#app').innerHTML = `
<section class="container mx-auto px-4 py-10">
  <div class="flex flex-col gap-4 justify-center items-center">
    <h1 class="text-4xl">Flappy Bird by ChatGPT</h1>
    <canvas id="game-canvas" width="384" height="640"></canvas>
    <p class="text-xl">黃色方塊為鳥</p>
    <p class="text-xl">按一下空白鍵 可以讓鳥飛得更高</p>
  </div>
</section>
`;
FlappyBird(document.querySelector('#game-canvas'));