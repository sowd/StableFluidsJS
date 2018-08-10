// Three.js docs: https://threejs.org/docs/index.html

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

    // Define shape
    setupGeometry(scene,128);

    // Render first frame
    renderer.render( scene, camera );
};

function setupGeometry(scene,numSlices){
    const xsiz = 128, ysiz = 128, zsiz = 128 ;
    const bUInt8 = true ;

    const tx_width = xsiz * zsiz, tx_height = ysiz ;

    // The volumetric texture is stored in single flat 2d texture
    let vol = (bUInt8
	       ? new Uint8Array( 4 * tx_width * tx_height )
	       : new Float32Array( 4 * tx_width * tx_height ) );
    function getVolIdx(ix,iy,iz){ return 4*( (iz*xsiz + ix)  + iy*(xsiz*zsiz) ) ;}

    // Create test data
    for( let zi=0;zi<zsiz;++zi ){
	let _z = 2.0*zi/(zsiz-1) - 1 ; // -1 to 1
	for( let yi=0;yi<ysiz;++yi ){
	    let _y = 2.0*yi/(ysiz-1) - 1 ;
	    for( let xi=0;xi<xsiz;++xi ){
		let _x = 2.0*xi/(xsiz-1) - 1 ;
		let dist = Math.sqrt( _x*_x + _y*_y + _z*_z );
		let density = (dist < 1 ? 1.0-dist : 0) ; // ball
		const iv = getVolIdx(xi,yi,zi);

		if( bUInt8 ){
		    vol[iv  ] = Math.floor(255*density+0.5);
		    vol[iv+1] = Math.floor(255*density+0.5);
		    vol[iv+2] = Math.floor(255*density+0.5);
		    vol[iv+3] = Math.floor(255*density+0.5);
		} else {
		    vol[iv  ] = density ;
		    vol[iv+1] = density ;
		    vol[iv+2] = density ;
		    vol[iv+3] = density ;
		}
	    }
	}
    }

    // Convert texture array to texture object
    let texture = new THREE.DataTexture( vol, tx_width, tx_height, THREE.RGBAFormat );
    texture.needsUpdate = true;


    /////////////////////////////////////////////////////
    // Geometry / material settings
    // Vertex/fragment shaders defined in index.html & render.js
    let material = genShaderMaterial(texture , zsiz /*texture z dim*/ , numSlices /*render plane number*/);

    //  Set rendering geometry
    const dz = 1.0 / numSlices ;
    for( let z = -0.5 ; z <= 0.5 ; z += dz ){

	const geometry = new THREE.Geometry();
	const siz = 0.5 ;
	geometry.vertices.push(new THREE.Vector3(-siz,  siz, z)); 
	geometry.vertices.push(new THREE.Vector3( siz,  siz, z)); 
	geometry.vertices.push(new THREE.Vector3( siz, -siz, z)); 
	geometry.vertices.push(new THREE.Vector3(-siz, -siz, z)); 
	geometry.faces.push(new THREE.Face3(0, 1, 2)); 
	geometry.faces.push(new THREE.Face3(0, 3, 2));

	//const geometry = new THREE.PlaneGeometry( 1, 1 ); mesh.position.z = z ;
	//let geometry = new THREE.BoxGeometry( 1, 1, 1 );
	let mesh = new THREE.Mesh( geometry, material );
	scene.add( mesh );
    }
}
