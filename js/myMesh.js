var container;
var camera,tb,scene,renderer,composer,depthMaterial,depthTarget;
function init(specimen) {
	container = document.getElementById('surface');
	var width = container.clientWidth;
	var height = 400;
	
	renderer = new THREE.WebGLRenderer();
	renderer.setSize(width,height);
	container.appendChild(renderer.domElement);

	camera = new THREE.PerspectiveCamera(25,width/height,10,1000 );
	camera.position.z = 200;
	
	tb = new THREE.TrackballControls(camera,container);
	tb.noZoom=true;
	tb.noPan=true;
	
	scene = new THREE.Scene();
	
	var loader = new THREE.BinaryLoader(true);
	loader.showStatus=true;
	var callbackSync = function( result ) {}
	var callbackProgress = function( progress, result ) {console.log(progress);}
	loader.callbackSync=callbackSync;
	loader.callbackProgress=callbackProgress;
	document.body.appendChild( loader.statusDomElement );
	loader.load(specimen, function(geometry,material){
		mesh=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({color:0xffffff}));
		scene.add(mesh);
		loader.statusDomElement.style.display = "none";
	});

	// depth
	var depthShader = THREE.ShaderLib[ "depthRGBA" ];
	var depthUniforms = THREE.UniformsUtils.clone( depthShader.uniforms );
	depthMaterial = new THREE.ShaderMaterial( { fragmentShader: depthShader.fragmentShader, vertexShader: depthShader.vertexShader, uniforms: depthUniforms } );
	depthMaterial.blending = THREE.NoBlending;

	// postprocessing
	composer = new THREE.EffectComposer( renderer );
	composer.addPass( new THREE.RenderPass( scene, camera ) );
	depthTarget = new THREE.WebGLRenderTarget( width, height, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, format: THREE.RGBAFormat } );
	var effect = new THREE.ShaderPass( THREE.SSAOShader );
	effect.uniforms[ 'tDepth' ].value = depthTarget;
	effect.uniforms[ 'size' ].value.set( width, height );
	effect.uniforms[ 'cameraNear' ].value = camera.near;
	effect.uniforms[ 'cameraFar' ].value = camera.far;
	effect.uniforms[ 'lumInfluence' ].value = 0.5;
	//effect.uniforms[ 'aoClamp' ].value = 0.9;
	effect.renderToScreen = true;
	composer.addPass( effect );

	window.addEventListener('resize',onWindowResize,false);
}
function onWindowResize() {
	camera.aspect = container.clientWidth/400;
	camera.updateProjectionMatrix();
	renderer.setSize( container.clientWidth,400 );
}
function animate(){
	requestAnimationFrame(animate);
	tb.update();
	scene.overrideMaterial = depthMaterial;
	renderer.render( scene, camera, depthTarget );
	scene.overrideMaterial = null;
	composer.render();
}
