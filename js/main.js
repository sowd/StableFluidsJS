// Three.js docs: https://threejs.org/docs/index.html

onload = function(){
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(
	50 /*FOV*/
	, window.innerWidth / window.innerHeight /*Aspect ratio*/
	, 0.1 /* Near clipping */, 1000 /*Far clipping*/ );

    var renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );

    var geometry = new THREE.BoxGeometry( 1, 1, 1 );

    var material = genShaderMaterial();
    //var material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
    var cube = new THREE.Mesh( geometry, material );
    scene.add( cube );

    camera.position.z = 2;

    virtualTrackBall(renderer,cube);


    function animate() {
	requestAnimationFrame( animate );

//	cube.rotation.x += 0.01;
//	cube.rotation.y += 0.01;

	renderer.render( scene, camera );
    }
    animate();

};

// Thanks to Eric @ https://jsfiddle.net/MadLittleMods/n6u6asza/
function virtualTrackBall(renderer,cube){
    var isDragging = false;
    var previousMousePosition = {
	x: 0,
	y: 0
    };
    $(renderer.domElement).on('mousedown', function(e) {
	isDragging = true;
    }).on('mousemove', function(e) {
	//console.log(e);
	var deltaMove = {
	    x: e.offsetX-previousMousePosition.x,
	    y: e.offsetY-previousMousePosition.y
	};

	if(isDragging) {
	    
	    var deltaRotationQuaternion = new THREE.Quaternion()
		.setFromEuler(new THREE.Euler(
		    toRadians(deltaMove.y * 1),
		    toRadians(deltaMove.x * 1),
		    0,
		    'XYZ'
		));
	    
	    cube.quaternion.multiplyQuaternions(deltaRotationQuaternion, cube.quaternion);
	}
	
	previousMousePosition = {
	    x: e.offsetX,
	    y: e.offsetY
	};
    });

    $(document).on('mouseup', function(e) {
	isDragging = false;
    });

    function toRadians(angle) {
	return angle * (Math.PI / 180);
    }

    function toDegrees(angle) {
	return angle * (180 / Math.PI);
    }
}
