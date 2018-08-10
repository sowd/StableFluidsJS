const Render = {
    allocate : function( xsiz , ysiz , zsiz , bUInt8){
	this.bUInt8 = (bUInt8 !== false) ; // setting

	this.xsiz = xsiz ; this.ysiz = ysiz ; this.zsiz = zsiz ;
	this.tx_width = xsiz * zsiz , this.tx_height = ysiz ;

	this.getVolIdx = function(ix,iy,iz){
	    return 4*( (iz*xsiz + ix)  + iy*(xsiz*zsiz) ) ;
	} ;
	this.vol = (this.bUInt8
		    ? new Uint8Array( 4 * this.tx_width * this.tx_height )
		    : new Float32Array( 4 * this.tx_width * this.tx_height ) );
    },
    set4DFloatVoxelArray : function( vData /*[iz][iy][ix]*/ ){
	const xsiz = vData[0][0].length ;
	const ysiz = vData[0].length ;
	const zsiz = vData.length ;

	test.assert( xsiz == this.xsiz );
	test.assert( ysiz == this.ysiz );
	test.assert( zsiz == this.zsiz );
	test.assert( this.vol != null );

	// Copy txData to this.vol
	for( let zi=0;zi<zsiz;++zi ){
	    for( let yi=0;yi<ysiz;++yi ){
		for( let xi=0;xi<xsiz;++xi ){
		    const rgba = vData[zi][yi][xi];
		    const vi = this.getVolIdx(xi,yi,zi);
		    if( this.bUInt8 ){
			this.vol[vi  ] = Math.floor(255*rgba[0]+0.5) ;
			this.vol[vi+1] = Math.floor(255*rgba[1]+0.5) ;
			this.vol[vi+2] = Math.floor(255*rgba[2]+0.5) ;
			this.vol[vi+3] = Math.floor(255*rgba[3]+0.5) ;
		    } else {
			this.vol[vi  ] = rgba[0] ;
			this.vol[vi+1] = rgba[1] ;
			this.vol[vi+2] = rgba[2] ;
			this.vol[vi+3] = rgba[3] ;
		    }
		}
	    }
	}
    }
    ,setScene : function(scene , numSlices  /*render plane number*/ , dAlphaMul){
	test.assert( this.vol !== null ) ;
	test.assert( this.xsiz !== null && this.ysiz !== null && this.zsiz !== null ) ;
	test.assert( this.tx_width !== null && this.tx_height !== null ) ;
	// Convert texture array to texture object
	this.texture = new THREE.DataTexture( this.vol, this.tx_width, this.tx_height, THREE.RGBAFormat );
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
		"texture" : {type: "t" , value:this.texture }
	    },
	    vertexShader: $("#vertexshader")[0].textContent,
	    fragmentShader:  $("#fragmentshader")[0].textContent,
	    side: THREE.DoubleSide,
	    transparent: true
	}
	this.material = new THREE.ShaderMaterial(ParamsShaderMaterial);

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
	    let mesh = new THREE.Mesh( geometry, this.material );
	    scene.add( mesh );
	}
    }
};
