const StableFluid = require('./js/fluid.js').StableFluid;
const sc = StableFluid.consts ;
const fs = require('fs');

/// File output seggings
const OUT_FILE_NAME_PREFIX='data/vol_';
const FRAMES = 128 ;

const siz = 64 ; // Volume dimension (including boundary)
const xsiz = siz-2, ysiz = siz-2, zsiz = siz-2 ;
const dt = 0.1 ;

// Define volume
let volData ;
volData = StableFluid.allocateZeroVolume(siz);

let srcVol = true ; // true uses default simulation setup
// Or optionally specify source density/flows
/*srcVol = StableFluid.allocateZeroVolume(siz, sc.numVxlProperties);
(function(){
    // Setup flow source
    const c = Math.floor(xsiz/2.0)+1;  // Center
    const cy = Math.floor(xsiz/4.0)+1;  // Center Y
    const r = Math.floor(xsiz/5.0);   // Source area r/2

    function setValToVol(vxl,propId,value){
	for( let iz = c-r ; iz <= c+r ; ++iz ){
	    for( let iy = cy-r ; iy <= cy+r ; ++iy ){
		for( let ix = c-r ; ix <= c+r ; ++ix ){
		    vxl[iz][iy][ix][propId] = value ;
		}
	    }
	}
    }
    setValToVol(srcVol,sc.Density,sourceDensityForDemo);
    setValToVol(srcVol,sc.FlowY,flowYForDemo);

})() ;
*/

StableFluid.connect(volData);

// See p.118 of mitsuba renderer document
// https://www.mitsuba-renderer.org/releases/current/documentation.pdf
const buf = new Buffer( 48 + 4 * siz*siz*siz ) ;

buf.write( 'VOL' , 0 , 3 );
buf.writeInt8( 3 , 3 );    // file format version
buf.writeInt32BE( 1 , 4 ); // Encoding ID (Dense float32-based representation)
buf.writeInt32BE( siz ,  8 ); // X dim
buf.writeInt32BE( siz , 12 ); // Y dim
buf.writeInt32BE( siz , 16 ); // Z dim
buf.writeInt32BE( 1 , 20 ); // # channels
buf.writeFloatBE( 0.0 , 24 ); // # xmin
buf.writeFloatBE( 0.0 , 28 ); // # ymin
buf.writeFloatBE( 0.0 , 32 ); // # zmin
buf.writeFloatBE( 1.0 , 36 ); // # xmax
buf.writeFloatBE( 1.0 , 40 ); // # ymax
buf.writeFloatBE( 1.0 , 44 ); // # zmax

for( let frameId = 0 ; frameId < FRAMES ; ++frameId ){
    StableFluid.step(dt, srcVol);

    // Copy voxel densities to buffer
    let bi = 48 ;
    for( let zi=0;zi<siz;++zi ){
	for( let yi=0;yi<siz;++yi ){
	    for( let xi=0;xi<siz;++xi , bi+=4){
		buf.writeFloatBE( StableFluid.vol[zi][yi][xi][sc.Density] , bi );
	    }
	}
    }

    console.log('Writing frame '+frameId+'.');
    fs.writeFileSync(OUT_FILE_NAME_PREFIX+frameId+'.vol',buf);
}
