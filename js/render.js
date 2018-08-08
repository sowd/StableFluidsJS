function genShaderMaterial(){
    var ParamsShaderMaterial = {
	uniforms: {
	    "time": {value: 1.0}
	},
	vertexShader: $("#vertexshader")[0].textContent,
	fragmentShader:  $("#fragmentshader")[0].textContent,
	side: THREE.DoubleSide,
	transparent: true
    }
    return new THREE.ShaderMaterial(ParamsShaderMaterial);
}
