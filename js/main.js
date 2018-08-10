// Three.js docs: https://threejs.org/docs/index.html

//const xsiz = 8, ysiz = 8, zsiz = 8 ;
const xsiz = 128, ysiz = 128, zsiz = 128 ;
const bFloatVoxel = true ; // if false, voxel is stored as uint8
const bLinearTextureInterpolation = true ; // if false, texture is nearest neighbor

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

    // Rendering loop
    function animate() {
	requestAnimationFrame( animate );
	ctrl.update();
    }
    animate();

    // Define volume
    let srcVoxel = [];
    for( let zi=0;zi<zsiz;++zi ){
	srcVoxel.push([]);
	for( let yi=0;yi<ysiz;++yi ){
	    srcVoxel[zi].push([]);
	    for( let xi=0;xi<xsiz;++xi ){
		srcVoxel[zi][yi].push( [1,1,1,1] );
	    }
	}
    }

    setPerlinNoise(srcVoxel,xsiz,ysiz,zsiz)


    Render.allocate(xsiz,ysiz,zsiz
		    , bFloatVoxel , bLinearTextureInterpolation );
    Render.set4DFloatVoxelArray(srcVoxel);
    Render.setScene( scene , numZPlanes , voxelBrightness );

    // Render first frame
    renderer.render( scene, camera );
};

function setPerlinNoise(srcVoxel,xsiz,ysiz,zsiz){
    for( let rgba=0;rgba<4;++rgba ){
	noise.seed(Math.random());
	for( let zi=0;zi<zsiz;++zi ){
	    let _z = 2.0*zi/(zsiz-1) - 1 ; // -1 to 1
	    for( let yi=0;yi<ysiz;++yi ){
		let _y = 2.0*yi/(ysiz-1) - 1 ;
		for( let xi=0;xi<xsiz;++xi ){
		    let _x = 2.0*xi/(xsiz-1) - 1 ;
		    srcVoxel[zi][yi][xi][rgba] = Math.abs( noise.perlin3(_x,_y,_z) ) ;
		}
	    }
	}
    }
}
