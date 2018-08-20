// Three.js docs: https://threejs.org/docs/index.html

let siz = 16 ; // Should be power of two
let xsiz = siz-2, ysiz = siz-2, zsiz = siz-2 ;

const sourceDensityForDemo = 10 ;
const flowYForDemo = 30 ;

const diffuseConst = 0.0001 ; // Diffuse
const viscosityConst = 0.001 ; // Viscousity

const dt = 0.1 ;

const bFloatVoxel = false ; // if false, voxel is stored as uint8
const bLinearTextureInterpolation = true ; // if false, texture is nearest neighbor

// This shows a bug that volume is not rendered from some angle
const bDbgShowRenderedAxis = false ;

const numZPlanes = 128 ; // Number of planes to slice volume
const voxelBrightness = 30.0 ;

let scene,ctrl,renderer,camera;
let volData , srcVol ;

onload = function(){
    // Start creation of the whole scene
    scene = new THREE.Scene();


    // Camera setup
    camera = new THREE.PerspectiveCamera(
	50 /*FOV*/
	, window.innerWidth / window.innerHeight /*Aspect ratio*/
	, 0.1 /* Near clipping */, 1000 /*Far clipping*/ );
    camera.position.z = 2;

    // Basic renderer setup
    renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );

    // Viewpoint (camera) controll by virtual trackball.
    // Usage described in:
    // https://www.youtube.com/watch?v=4_KkHLimetQ
    // http://irukanobox.blogspot.com/2016/06/threejstrackballcontrols.html
    ctrl = new THREE.TrackballControls( camera );
    ctrl.addEventListener('change',()=>{renderer.render( scene, camera );});

    // Parse args
    let urlargs = {} ;
    (function(){
	let ui = location.href.indexOf('?') ;
	if( ui > 1 ){
	    let up = location.href.substring( ui+1 ) ;
	    up.split('&').forEach(eq=>{
		let terms = eq.split('=');
		urlargs[terms[0]] = terms[1] ;
	    });
	}
    })();

    switch( urlargs.type ){
    case 'noise':
	// set volData
	volData = StableFluid.allocateZeroVolume(siz);
	xsiz = ysiz = zsiz = siz-2;
	setPerlinNoise();
	renderMain();
	break;
    case 'data': alert('Not implemented yet');
	break ;
    case 'simulate' : // equals default
    default :
	if(urlargs.file != null ){ // One frame rendering
	    setupOneFrame(urlargs.file,function(){
		renderMain();
	    });
	} else { // Simulation
	    // set volData
	    volData = StableFluid.allocateZeroVolume(siz);
	    xsiz = ysiz = zsiz = siz-2;
	    srcVol = StableFluid.allocateZeroVolume(siz, srcVolNumProperties);

	    // Setup flow source
	    const c = Math.floor(xsiz/2.0)+1;  // Center
	    const cy = Math.floor(xsiz/4.0)+1;  // Center Y
	    const r = Math.floor(xsiz/6.0);   // Source area r/2

	    function setValToVol(vxl,propId,value){
		for( let iz = c-r ; iz <= c+r ; ++iz ){
		    for( let iy = cy-r ; iy <= cy+r ; ++iy ){
			for( let ix = c-r ; ix <= c+r ; ++ix ){
			    vxl[iz][iy][ix][propId] = value ;
			}
		    }
		}
	    }
	    setValToVol(srcVol,Density,sourceDensityForDemo);
	    setValToVol(srcVol,FlowY,flowYForDemo);
	    
	    StableFluid.connect(volData);

	    renderMain(()=>{
		// Update simulation and reflect it to texture
		StableFluid.step(dt , diffuseConst , viscosityConst , srcVol);

		srcVol = null // Clear all source after first frame
		//setValToVol(srcVol,Density,0); // Clear density source
		//setValToVol(srcVol,FlowY,0);

		Render.set4DFloatVoxelArray(StableFluid.vol);
		Render.updateTextureByStoredTxVol();
	    });
	}
    }
};


function renderMain(onFrame){
    Render.allocate(xsiz,ysiz,zsiz
		    , bFloatVoxel , bLinearTextureInterpolation );
    Render.set4DFloatVoxelArray(volData);
    Render.setMeshes( scene , numZPlanes , voxelBrightness );
    Render.setScene( 2,1 );

    // Rendering loop
    let dbgRenderedAxisStr = '';

    function animate() {
	if( onFrame != null )
	    onFrame();

	requestAnimationFrame( animate );
	ctrl.update();

	// Check proper rendering order (buggy)
	const m = camera.matrix;
	const vvec = [ m.elements[8],m.elements[9],m.elements[10] ] ;
	const vvec_abs = [ Math.abs(vvec[0]), Math.abs(vvec[1]), Math.abs(vvec[2]) ] ;
	const axis = ( vvec_abs[0] > vvec_abs[1]
		       ? (vvec_abs[0] > vvec_abs[2] ? 0:2) 
		       : (vvec_abs[1] > vvec_abs[2] ? 1:2) ) ;

	let order = (vvec[axis]>0?1:0) ;
	// invert x,y axes
	if( axis != 2 ) order = 1 - order ;

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
}


function setupOneFrame(fname,oncomplete){
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'data/'+fname, true);
    xhr.responseType = 'arraybuffer';
    xhr.onload = function(e) {
	let buf = this.response ;

	buf = new DataView(buf);

	siz = buf.getInt32(8,false);
	volData = StableFluid.allocateZeroVolume(siz);
	xsiz = ysiz = zsiz = siz-2;

	let vxl_i = 48 ;
	for( let zi=0;zi<siz;++zi ){
	    for( let yi=0;yi<siz;++yi ){
		for( let xi = 0 ; xi < siz ; ++xi , vxl_i += 4 ){
		    volData[zi][yi][xi][Density]
			= buf.getFloat32(vxl_i,false); ;
		}
	    }
	}

	if( oncomplete )
	    oncomplete();
    };

    xhr.send();
}

// Only for debug purpose (not used anymore
function setPerlinNoise(){
    for( let vpi=0 ; vpi<numVxlProperties ; ++vpi ){
	noise.seed(Math.random());
	for( let zi=1;zi<=zsiz;++zi ){
	    let _z = 2.0*(zi-1)/(zsiz-1) - 1 ; // -1 to 1
	    for( let yi=1;yi<=ysiz;++yi ){
		let _y = 2.0*(yi-1)/(ysiz-1) - 1 ;
		for( let xi=1;xi<=xsiz;++xi ){
		    let _x = 2.0*(xi-1)/(xsiz-1) - 1 ;
		    volData[zi][yi][xi][vpi]
			= Math.abs( noise.perlin3(_x,_y,_z) ) ;
		}
	    }
	}
    }
}
