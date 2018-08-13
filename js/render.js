const Render = {
    allocate : function( xsiz , ysiz , zsiz , bFloat , bLinear ){
	this.bFloat = (bFloat !== false) ;
	this.bLinear = (bLinear !== false) ;

	this.xsiz = xsiz ; this.ysiz = ysiz ; this.zsiz = zsiz ;
	this.tx_width = xsiz * zsiz , this.tx_height = ysiz ;

	this.txVol = (this.bFloat
		    ? new Float32Array( 4 * this.tx_width * this.tx_height )
		    : new Uint8Array( 4 * this.tx_width * this.tx_height ) );
    }
    ,set4DFloatVoxelArray : function( srcVolArray /*[iz][iy][ix]=[FlowX,FlowY,FlowZ,Density]*/ ){
	const xsiz = srcVolArray[0][0].length-2 ;
	const ysiz = srcVolArray[0].length-2 ;
	const zsiz = srcVolArray.length-2 ;

	test.assert( xsiz == this.xsiz );
	test.assert( ysiz == this.ysiz );
	test.assert( zsiz == this.zsiz );
	test.assert( this.txVol != null );

	function getVoxelIdx(ix,iy,iz){
	    return 4*( (iz*xsiz + ix)  + iy*(xsiz*zsiz) ) ;
	} ;
	// Copy txData to this.txVol
	for( let zi=1;zi<=zsiz;++zi ){
	    for( let yi=1;yi<=ysiz;++yi ){
		for( let xi=1;xi<=xsiz;++xi ){
		    const voxel = srcVolArray[zi][yi][xi];
		    const vi = getVoxelIdx(xi-1,yi-1,zi-1);
		    if( this.bFloat ){
			this.txVol[vi  ] = voxel[0] ;
			this.txVol[vi+1] = voxel[1] ;
			this.txVol[vi+2] = voxel[2] ;
			this.txVol[vi+3] = voxel[3] ;
		    } else {
			this.txVol[vi  ] = Math.floor(255*voxel[0]+0.5) ;
			this.txVol[vi+1] = Math.floor(255*voxel[1]+0.5) ;
			this.txVol[vi+2] = Math.floor(255*voxel[2]+0.5) ;
			this.txVol[vi+3] = Math.floor(255*voxel[3]+0.5) ;
		    }
		}
	    }
	}
    }
    ,setMeshes : function(scene , numSlices  /*render plane number*/ , dAlphaMul){
	test.assert( this.txVol !== null ) ;
	test.assert( this.xsiz !== null && this.ysiz !== null && this.zsiz !== null ) ;
	test.assert( this.tx_width !== null && this.tx_height !== null ) ;
	this.scene = scene ;
	// Convert texture array to texture object
	this.texture = new THREE.DataTexture(
	    this.txVol, this.tx_width, this.tx_height, THREE.RGBAFormat
	    , this.bFloat ? THREE.FloatType : THREE.UnsignedByteType // type
	    , THREE.UVMapping // mapping
	    , THREE.RepeatWrapping // THREE.ClampToEdgeWrapping // wrapS
	    , THREE.RepeatWrapping // THREE.ClampToEdgeWrapping // wrapT
	    , this.bLinear ? THREE.LinearFilter : THREE.NearestFilter // magFilter
	    , THREE.NearestFilter // minFilter
	    , 1 // anisotropy
	);
	this.texture.needsUpdate = true;
	this.numSlices = numSlices ;
	if( dAlphaMul == null ) dAlphaMul = 1.0;

	/////////////////////////////////////////////////////
	// Geometry / material settings
	// Vertex/fragment shaders defined in index.html
	const ParamsShaderMaterial = {
	    uniforms: {
		"z_size": {value: this.zsiz},
		"d_alpha": {value: dAlphaMul/this.numSlices},
		"bLinear": {value: this.bLinear ? 1.0 : 0.0 },
		"texture" : {type: "t" , value:this.texture }
	    },
	    vertexShader: $("#vertexshader")[0].textContent,
	    fragmentShader:  $("#fragmentshader")[0].textContent,
	    side: THREE.DoubleSide, //THREE.FrontSide,
	    transparent: true
	}
	this.material = new THREE.ShaderMaterial(ParamsShaderMaterial);

	//  Set rendering geometry
	const axismap = [
	    [ [ 2,0,1,1 ], [ 2,0,1,-1 ] ], // x
	    [ [ 1,2,0,1 ], [ 1,2,0,-1 ] ], // y
	    [ [ 0,1,2,-1 ], [ 0,1,2,1 ] ]  // z
	] ;
	meshes = [] ;
	for( let axis = 0 ; axis < 3 ; ++axis ){
	    meshes.push([]);
	    for( let order = 0 ; order < 2 ; ++order ){
		meshes[axis].push([]);
		function setVec( p1,p2,_r ){
		    const map = axismap[axis][order];
		    const args = [arguments[0],arguments[1],arguments[2]*map[3]] ;
		    return new THREE.Vector3(
			args[map[0]] , args[map[1]] , args[map[2]]);
		}
		const dr = 1.0 / numSlices ;
		for( let r = -0.5 ; r <= 0.5 ; r += dr ){

		    const geometry = new THREE.Geometry();
		    const siz = 0.5 ;
		    geometry.vertices.push(setVec(-siz,  siz, r)); 
		    geometry.vertices.push(setVec( siz,  siz, r)); 
		    geometry.vertices.push(setVec( siz, -siz, r)); 
		    geometry.vertices.push(setVec(-siz, -siz, r)); 
		    geometry.faces.push(new THREE.Face3(0, 2, 1)); 
		    geometry.faces.push(new THREE.Face3(0, 3, 2));

		    //const geometry = new THREE.PlaneGeometry( 1, 1 ); mesh.position.z = z ;
		    //let geometry = new THREE.BoxGeometry( 1, 1, 1 );
		    let mesh = new THREE.Mesh( geometry, this.material );
		    meshes[axis][order].push(mesh);
		}
	    }
	}

	this.meshes = meshes ;
    }
    , setScene: function(axis,order){
	if( this.meshes == null )
	    return ;

	if( this.meshAxis != null && this.meshOrder != null
	    && (this.meshAxis != axis || this.meshOrder != order) ){

	    this.meshes[this.meshAxis][this.meshOrder].forEach(mesh =>{
		this.scene.remove(mesh);
	    });
	}
	this.meshAxis = axis ;
	this.meshOrder = order ;
	this.meshes[axis][order].forEach(mesh =>{
	    this.scene.add(mesh);
	});
    }
};
