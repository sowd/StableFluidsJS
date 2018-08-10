function genShaderMaterial(texture , z_size , numSlices){
    var ParamsShaderMaterial = {
	uniforms: {
	    "z_size": {value: z_size},
	    "d_alpha": {value: 1.0/numSlices},
	    "texture" : {type: "t" , value:texture }
	},
	vertexShader: $("#vertexshader")[0].textContent,
	fragmentShader:  $("#fragmentshader")[0].textContent,
	side: THREE.DoubleSide,
	transparent: true
    }
    return new THREE.ShaderMaterial(ParamsShaderMaterial);
}
