// Three.js docs: https://threejs.org/docs/index.html

onload = function(){
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(
	75 /*FOV*/
	, window.innerWidth / window.innerHeight /*Aspect ratio*/
	, 0.1 /* Near clipping */, 1000 /*Far clipping*/ );

    var renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );

    var geometry = new THREE.BoxGeometry( 1, 1, 1 );
    var material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
    var cube = new THREE.Mesh( geometry, material );
    scene.add( cube );

    camera.position.z = 5;

    function animate() {
	requestAnimationFrame( animate );

	cube.rotation.x += 0.01;
	cube.rotation.y += 0.01;

	renderer.render( scene, camera );
    }
    animate();
};
