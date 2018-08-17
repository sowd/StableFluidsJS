// Three.js docs: https://threejs.org/docs/index.html

const siz = 32 ; // Should be power of two
const xsiz = siz-2, ysiz = siz-2, zsiz = siz-2 ;

const dt = 0.1 ;
const bSourceExistsOnlyFirstFrame = false ;
const sourceDensityForDemo = 100 ;
const flowYForDemo = 1000 ;

const diffuseConst = 0.001 ; // Diffuse

const bFloatVoxel = false ; // if false, voxel is stored as uint8
const bLinearTextureInterpolation = true ; // if false, texture is nearest neighbor

// This shows a bug that volume is not rendered from some angle
const bDbgShowRenderedAxis = false ;

const numZPlanes = 128 ; // Number of planes to slice volume
const voxelBrightness = 30.0 ;



onload = function(){
    // Start creation of the whole scene
    const scene = new THREE.Scene();


    // Camera setup
    const camera = new THREE.PerspectiveCamera(
	50 /*FOV*/
	, window.innerWidth / window.innerHeight /*Aspect ratio*/
	, 0.1 /* Near clipping */, 1000 /*Far clipping*/ );
    camera.position.z = 2;

    // Basic renderer setup
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );

    // Viewpoint (camera) controll by virtual trackball.
    // Usage described in:
    // https://www.youtube.com/watch?v=4_KkHLimetQ
    // http://irukanobox.blogspot.com/2016/06/threejstrackballcontrols.html
    const ctrl = new THREE.TrackballControls( camera );
    ctrl.addEventListener('change',()=>{renderer.render( scene, camera );});

    // Define volume
    let srcVoxel = [];
    let zeroVoxel = [];
    for( let zvi=0;zvi<numVxlProperties;++zvi ) zeroVoxel.push(0);
    for( let zi=0;zi<zsiz+2;++zi ){
	srcVoxel.push([]);
	for( let yi=0;yi<ysiz+2;++yi ){
	    srcVoxel[zi].push([]);
	    for( let xi=0;xi<xsiz+2;++xi ){
		// FlowX, FlowY, FlowZ, Density, Tmp
		srcVoxel[zi][yi].push( Array.from(zeroVoxel) );
	    }
	}
    }

    setSquareSourceDemo(srcVoxel)
    //setPerlinNoise(srcVoxel)


    Render.allocate(xsiz,ysiz,zsiz
		    , bFloatVoxel , bLinearTextureInterpolation );
    Render.set4DFloatVoxelArray(srcVoxel);
    Render.setMeshes( scene , numZPlanes , voxelBrightness );
    Render.setScene( 2,1 );

    StableFluid.connect(srcVoxel);
    
    // Rendering loop
    let dbgRenderedAxisStr = '';

    function animate() {
	// Update simulation
	StableFluid.step(dt,diffuseConst);
	Render.set4DFloatVoxelArray(StableFluid.vol);
	Render.updateTextureByStoredTxVol();

	if( bSourceExistsOnlyFirstFrame )
	    // Source exists only at the first frame
	    resetSource(srcVoxel);

	requestAnimationFrame( animate );
	ctrl.update();

	// Check proper rendering order (buggy)
	const m = camera.matrixWorldInverse ;
	//const m = camera.projectionMatrix;
	const vvec = [
		m.elements[8],m.elements[9],m.elements[10]
	] ;
	const vvec_abs = [ Math.abs(vvec[0]), Math.abs(vvec[1]), Math.abs(vvec[2]) ] ;
	const axis = ( vvec_abs[0] > vvec_abs[1]
		     ? (vvec_abs[0] > vvec_abs[2] ? 0:2) 
		     : (vvec_abs[1] > vvec_abs[2] ? 1:2) ) ;

	const order = (vvec[axis]>0?1:0) ;

	Render.setScene(axis,order);
	renderer.render( scene, camera );

	if( bDbgShowRenderedAxis ){
	    const _dbgRenderedAxisStr = (order>0?'':'-') + (axis==0?'X':(axis==1?'Y':'Z')) ;
	    if( dbgRenderedAxisStr != _dbgRenderedAxisStr ){
		console.log(_dbgRenderedAxisStr);
		dbgRenderedAxisStr = _dbgRenderedAxisStr ;
	    }
	}
    }
    animate();

    // Render first frame
    renderer.render( scene, camera );
};

function setSquareSourceDemo(srcVoxel){
    const xsiz = srcVoxel[0][0].length-2 ;
    const ysiz = srcVoxel[0].length-2 ;
    const zsiz = srcVoxel.length-2 ;

    const c = Math.floor(xsiz/2.0)+1;  // Center
    const r = Math.floor(xsiz/10.0);   // Source area r/2
    for( let iz = c-r ; iz <= c+r ; ++iz ){
	for( let ix = c-r ; ix <= c+r ; ++ix ){
	    srcVoxel[iz][1][ix][SourceDensity] = sourceDensityForDemo ;
	    srcVoxel[iz][1][ix][FlowY] = flowYForDemo ;
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
		vxl[SourceFlowX]
		    = vxl[SourceFlowY]
		    = vxl[SourceFlowZ]
		    = vxl[SourceDensity]
		    = 0;
	    }
	}
    }
}

// Only for debug purpose (not used anymore
function setPerlinNoise(srcVoxel){
    const xsiz = srcVoxel[0][0].length-2 ;
    const ysiz = srcVoxel[0].length-2 ;
    const zsiz = srcVoxel.length-2 ;
    for( let vpi=0 ; vpi<numVxlProperties ; ++vpi ){
	noise.seed(Math.random());
	for( let zi=1;zi<=zsiz;++zi ){
	    let _z = 2.0*(zi-1)/(zsiz-1) - 1 ; // -1 to 1
	    for( let yi=1;yi<=ysiz;++yi ){
		let _y = 2.0*(yi-1)/(ysiz-1) - 1 ;
		for( let xi=1;xi<=xsiz;++xi ){
		    let _x = 2.0*(xi-1)/(xsiz-1) - 1 ;
		    srcVoxel[zi][yi][xi][vpi] = Math.abs( noise.perlin3(_x,_y,_z) ) ;
		}
	    }
	}
    }
}

