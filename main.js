const StableFluid = require('./js/fluid.js').StableFluid;
const fs = require('fs');

/// File output seggings
const OUT_FILE_NAME_PREFIX='data/vol_';
const FRAMES = 3 ;

const siz = 64 ; // Volume dimension (including boundary)
const xsiz = siz-2, ysiz = siz-2, zsiz = siz-2 ;

const dt = 0.1 ;
const bSourceExistsOnlyFirstFrame = false ;
const sourceDensityForDemo = 100 ;
const flowYForDemo = 1000 ;

const diffuseConst = 0.001 ; // Diffuse

// Define volume
let srcVoxel = [];
let zeroVoxel = [];
for( let zvi=0;zvi<StableFluid.consts.numVxlProperties;++zvi ) zeroVoxel.push(0);
for( let zi=0;zi<siz;++zi ){
    srcVoxel.push([]);
    for( let yi=0;yi<siz;++yi ){
	srcVoxel[zi].push([]);
	for( let xi=0;xi<siz;++xi ){
	    // FlowX, FlowY, FlowZ, Density, Tmp
	    srcVoxel[zi][yi].push( Array.from(zeroVoxel) );
	}
    }
}

function setSquareSourceDemo(srcVoxel){
    const xsiz = srcVoxel[0][0].length-2 ;
    const ysiz = srcVoxel[0].length-2 ;
    const zsiz = srcVoxel.length-2 ;

    const c = Math.floor(xsiz/2.0)+1;  // Center
    const r = Math.floor(xsiz/10.0);   // Source area r/2
    for( let iz = c-r ; iz <= c+r ; ++iz ){
	for( let ix = c-r ; ix <= c+r ; ++ix ){
	    srcVoxel[iz][1][ix][StableFluid.consts.SourceDensity]
		= sourceDensityForDemo ;
	    srcVoxel[iz][1][ix][StableFluid.consts.FlowY]
		= flowYForDemo ;
	}
    }
}

function resetSource(srcVoxel){
    const xsiz = srcVoxel[0][0].length-2 ;
    const ysiz = srcVoxel[0].length-2 ;
    const zsiz = srcVoxel.length-2 ;
    for( let zi=1;zi<=zsiz;++zi ){
	for( let yi=1;yi<=ysiz;++yi ){
	    for( let xi=1;xi<=xsiz;++xi ){
		const vxl = srcVoxel[zi][yi][xi];
		vxl[StableFluid.consts.SourceFlowX]
		    = vxl[StableFluid.consts.SourceFlowY]
		    = vxl[StableFluid.consts.SourceFlowZ]
		    = vxl[StableFluid.consts.SourceDensity]
		    = 0;
	    }
	}
    }
}





setSquareSourceDemo(srcVoxel)

StableFluid.connect(srcVoxel);


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
    StableFluid.step(dt,diffuseConst);

    // Copy voxel densities to buffer
    let bi = 48 ;
    for( let zi=0;zi<siz;++zi ){
	for( let yi=0;yi<siz;++yi ){
	    for( let xi=0;xi<siz;++xi , bi+=4){
		buf.writeFloatBE( srcVoxel[zi][yi][xi][StableFluid.consts.Density] , bi );
	    }
	}
    }

    (function(){
	let frmId = frameId ;
	console.log('Writing frame '+frmId+'.');
	fs.writeFile( OUT_FILE_NAME_PREFIX+frameId+'.vol' , buf, 'binary',
		      function(){} ) ;
    }()) ;
}
