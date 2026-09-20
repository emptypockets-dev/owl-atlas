import assert from 'node:assert/strict';
import {artifactView} from '../src/artifact-explorer.js';

let checks=0;
for (const stage of [{width:720,height:640},{width:270,height:190}]) {
  for (const image of [{width:1920,height:1973},{width:2634,height:2736},{width:800,height:400},{width:120,height:90}]) {
    for (const rotation of [0,30,-45,90]) {
      const state={focus:{x:.775,y:.48},zoom:2.2,rotation};
      const view=artifactView(stage,image,state);
      const a=rotation*Math.PI/180;
      const x=(state.focus.x-.5)*view.width, y=(state.focus.y-.5)*view.height;
      assert(Math.abs(view.x+view.zoom*(x*Math.cos(a)-y*Math.sin(a)))<1e-9);
      assert(Math.abs(view.y+view.zoom*(x*Math.sin(a)+y*Math.cos(a)))<1e-9);
      assert(view.width*view.zoom<=image.width+1e-9);
      assert(view.height*view.zoom<=image.height+1e-9);
      checks+=4;
    }
  }
}
console.log(`PASS: ${checks} artifact focus, rotation, aspect-ratio and resolution checks.`);
