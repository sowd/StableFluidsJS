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
    setupGeometry(scene);

    // Render first frame
    renderer.render( scene, camera );
};

function setupGeometry(scene){
    /////////////////////////////////////////////////////
    // Geometry / material settings
    // Vertex/fragment shaders defined in index.html & render.js
    let material = genShaderMaterial();

    //  Set rendering geometry
    for( let z = -0.5 ; z <= 0.5 ; z += 0.05 ){

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
