// Implements Stam's Stable Fluid
// https://pdfs.semanticscholar.org/847f/819a4ea14bd789aca8bc88e85e906cfc657c.pdf

// Voxel properties
const numVxlProperties = 6 , srcVolNumProperties = 4 ;
const FlowX = 0 , FlowY = 1 , FlowZ = 2 , Density = 3 ;
const Temp1 = 4 , Temp2 = 5;


// Add source information (in 'SourceDensity' element of each voxel)
// to the Density of the volume.
function addSource(dt, vol, prevVol, srcVol, propId){
    const N = vol.length-2;
    for( let iz=0 ; iz<N+2 ; ++iz){
        for( let iy=0 ; iy<N+2 ; ++iy ){
            for( let ix=0 ; ix<N+2 ; ++ix ){
                vol[iz][iy][ix][propId] =
		    prevVol[iz][iy][ix][propId] + dt * srcVol[iz][iy][ix][propId] ;
            }
        }
    }
}
function copyVol( srcVol,tgtVol,propId ){
    const N = srcVol.length-2;
    for( let iz=0 ; iz<N+2 ; ++iz){
        for( let iy=0 ; iy<N+2 ; ++iy ){
            for( let ix=0 ; ix<N+2 ; ++ix ){
		if( propId == null ){
		    for( let pi=0;pi<tgtVol[iz][iy][ix].length;++pi ){
			tgtVol[iz][iy][ix][pi] = srcVol[iz][iy][ix][pi] ;
		    }
		} else {
                    tgtVol[iz][iy][ix][propId] = srcVol[iz][iy][ix][propId] ;
		}
            }
        }
    }
}

function diffuse( dt, vol, prevVol, propId, diff, b ){
    const N = vol.length-2;
    const a = dt * diff * N * N * N ;

    for( let k=0 ; k<20 ; ++k ){
        for( let iz=1 ; iz<=N ; ++iz){
            for( let iy=1 ; iy<=N ; ++iy ){
                for( let ix=1 ; ix<=N ; ++ix ){
                    vol[iz][iy][ix][Temp1] =
                        (   prevVol[iz][iy][ix][propId]
                            + a * (
                                   vol[iz-1][iy][ix][propId]
                                +  vol[iz+1][iy][ix][propId]
                                +  vol[iz][iy-1][ix][propId]
                                +  vol[iz][iy+1][ix][propId]
                                +  vol[iz][iy][ix-1][propId]
                                +  vol[iz][iy][ix+1][propId]
                                )
                        ) / (1+6*a) ;
                }
            }
        }

        // Copy back temp value to current density
        for( let iz=1 ; iz<=N ; ++iz){
            for( let iy=1 ; iy<=N ; ++iy ){
                for( let ix=1 ; ix<=N ; ++ix ){
                    let voxel = vol[iz][iy][ix];
                    voxel[propId] = voxel[Temp1] ;
                }
            }
        }

        setBnd(vol,propId,b);
    }
}

function advect(dt, vol, volPrev, propId, b){
    const N = vol.length-2 ;
    const dt0 = dt*N;
    const vp = volPrev;
    for( let iz=1 ; iz<=N ; ++iz){
        for( let iy=1 ; iy<=N ; ++iy ){
            for( let ix=1 ; ix<=N ; ++ix ){
                //const voxel = ;
                const voxelPrev = vp[iz][iy][ix];

                let x = ix - dt0*voxelPrev[FlowX];
                let y = iy - dt0*voxelPrev[FlowY];
                let z = iz - dt0*voxelPrev[FlowZ];
                if( x < 0.5 ) x = 0.5 ; if( x > N+0.5) x = N+0.5 ;
                if( y < 0.5 ) y = 0.5 ; if( y > N+0.5) y = N+0.5 ;
                if( z < 0.5 ) z = 0.5 ; if( z > N+0.5) z = N+0.5 ;
		const x0 = Math.floor(x), y0 = Math.floor(y), z0 = Math.floor(z);
		const px = x-x0, py = y-y0, pz = z-z0 ;

		vol[iz][iy][ix][propId] =
		    (1-pz)*((1-py)*((1-px)*vp[z0  ][y0  ][x0][propId] + px*vp[z0  ][y0  ][x0+1][propId])
			    +  py *((1-px)*vp[z0  ][y0+1][x0][propId] + px*vp[z0  ][y0+1][x0+1][propId]))
		    +  pz *((1-py)*((1-px)*vp[z0+1][y0  ][x0][propId] + px*vp[z0+1][y0  ][x0+1][propId])
    			    +  py *((1-px)*vp[z0+1][y0+1][x0][propId] + px*vp[z0+1][y0+1][x0+1][propId])) ;
            }
        }
    }
    setBnd(vol,propId,b);
}

function project(vol){
    const N = vol.length-2 ;
    const Div = Temp1 ;
    const P = Temp2 ;

    const h = 1.0/N;
    for( let iz=1 ; iz<=N ; ++iz){
        for( let iy=1 ; iy<=N ; ++iy ){
            for( let ix=1 ; ix<=N ; ++ix ){
                vol[iz][iy][ix][Div] =
		    -0.5*h*(
			 vol[iz][iy][ix+1][FlowX] - vol[iz][iy][ix-1][FlowX]
			+vol[iz][iy+1][ix][FlowY] - vol[iz][iy-1][ix][FlowY]
			+vol[iz+1][iy][ix][FlowZ] - vol[iz-1][iy][ix][FlowZ]
		    ) ;
                vol[iz][iy][ix][P] = 0 ;
	    }
	}
    }
    setBnd ( vol,Div,0 );
    setBnd ( vol,  P,0 );

    for ( let k=0 ; k<20 ; ++k ) {
	for( let iz=1 ; iz<=N ; ++iz){
            for( let iy=1 ; iy<=N ; ++iy ){
		for( let ix=1 ; ix<=N ; ++ix ){
                    vol[iz][iy][ix][P] =
			            (vol[iz][iy][ix][Div]
			            +vol[iz][iy][ix-1][P]+vol[iz][iy][ix+1][P]
			            +vol[iz][iy-1][ix][P]+vol[iz][iy+1][ix][P]
			            +vol[iz-1][iy][ix][P]+vol[iz+1][iy][ix][P]) / 6 ;
		        }
	        }
	    }
	    setBnd ( vol, P, 0 );
    }
    for( let iz=1 ; iz<=N ; ++iz){
        for( let iy=1 ; iy<=N ; ++iy ){
	    for( let ix=1 ; ix<=N ; ++ix ){
		vol[iz][iy][ix][FlowX]
		    -= 0.5*(vol[iz][iy][ix+1][P]-vol[iz][iy][ix-1][P]) / h ;
		vol[iz][iy][ix][FlowY]
		    -= 0.5*(vol[iz][iy+1][ix][P]-vol[iz][iy-1][ix][P]) / h ;
		vol[iz][iy][ix][FlowZ]
		    -= 0.5*(vol[iz+1][iy][ix][P]-vol[iz-1][iy][ix][P]) / h ;
	    }
	}
    }
    setBnd(vol,FlowX,1);
    setBnd(vol,FlowY,2);
    setBnd(vol,FlowZ,3);
}

function setBnd(vol,propId,b){
    const N = vol.length-2 ;
    for ( let i=1 ; i<=N ; ++i ){
	for ( let j=1 ; j<=N ; ++j ){
	    vol[i][j][  0][propId] = vol[i][j][1][propId] ;
	    vol[i][j][N+1][propId] = vol[i][j][N][propId] ;
	    vol[i][  0][j][propId] = vol[i][1][j][propId] ;
	    vol[i][N+1][j][propId] = vol[i][N][j][propId] ;
	    vol[  0][i][j][propId] = vol[1][i][j][propId] ;
	    vol[N+1][i][j][propId] = vol[N][i][j][propId] ;

	    switch(b){
	    case 1 :
		vol[i][j][  0][propId] = -vol[i][j][  0][propId] ;
		vol[i][j][N+1][propId] = -vol[i][j][N+1][propId] ;
		break ;
	    case 2 :
		vol[i][  0][j][propId] = -vol[i][  0][j][propId] ;
		vol[i][N+1][j][propId] = -vol[i][N+1][j][propId] ;
		break ;
	    case 3 :
		vol[  0][i][j][propId] = -vol[  0][i][j][propId] ;
		vol[N+1][i][j][propId] = -vol[N+1][i][j][propId] ;
		break ;
	    }

	}
    }
    for ( let i=1 ; i<=N ; ++i ){
	vol[i][  0][  0][propId] = 0.5*( vol[i][0][  1][propId] + vol[i][  1][0][propId] ) ;
	vol[i][  0][N+1][propId] = 0.5*( vol[i][1][N+1][propId] + vol[i][  0][N][propId] ) ;
	vol[i][N+1][  0][propId] = 0.5*( vol[i][N][0  ][propId] + vol[i][N+1][1][propId] ) ;
	vol[i][N+1][N+1][propId] = 0.5*( vol[i][N][N+1][propId] + vol[i][N+1][N][propId] ) ;

    	vol[  0][i][  0][propId] = 0.5*( vol[0][i][  1][propId] + vol[  1][i][0][propId] ) ;
	vol[  0][i][N+1][propId] = 0.5*( vol[1][i][N+1][propId] + vol[  0][i][N][propId] ) ;
	vol[N+1][i][  0][propId] = 0.5*( vol[N][i][0  ][propId] + vol[N+1][i][1][propId] ) ;
	vol[N+1][i][N+1][propId] = 0.5*( vol[N][i][N+1][propId] + vol[N+1][i][N][propId] ) ;

    	vol[  0][  0][i][propId] = 0.5*( vol[0][  1][i][propId] + vol[  1][0][i][propId] ) ;
	vol[  0][N+1][i][propId] = 0.5*( vol[1][N+1][i][propId] + vol[  0][N][i][propId] ) ;
	vol[N+1][  0][i][propId] = 0.5*( vol[N][0  ][i][propId] + vol[N+1][1][i][propId] ) ;
	vol[N+1][N+1][i][propId] = 0.5*( vol[N][N+1][i][propId] + vol[N+1][N][i][propId] ) ;
    }

    vol[  0][  0][  0][propId] = ( vol[  1][  0][  0][propId] + vol[  0][  1][  0][propId] + vol[  0][  0][  1][propId] )/3.0 ;
    vol[  0][  0][N+1][propId] = ( vol[  1][  0][N+1][propId] + vol[  0][  1][N+1][propId] + vol[  0][  0][  N][propId] )/3.0 ;
    vol[  0][N+1][  0][propId] = ( vol[  1][N+1][  0][propId] + vol[  0][  N][  0][propId] + vol[  0][N+1][  1][propId] )/3.0 ;
    vol[  0][N+1][N+1][propId] = ( vol[  1][N+1][N+1][propId] + vol[  0][  N][N+1][propId] + vol[  0][N+1][  N][propId] )/3.0 ;
    vol[N+1][  0][  0][propId] = ( vol[  N][  0][  0][propId] + vol[N+1][  1][  0][propId] + vol[N+1][  0][  1][propId] )/3.0 ;
    vol[N+1][  0][N+1][propId] = ( vol[  N][  0][N+1][propId] + vol[N+1][  1][N+1][propId] + vol[N+1][  0][  N][propId] )/3.0 ;
    vol[N+1][N+1][  0][propId] = ( vol[  N][N+1][  0][propId] + vol[N+1][  N][  0][propId] + vol[N+1][N+1][  1][propId] )/3.0 ;
    vol[N+1][N+1][N+1][propId] = ( vol[  N][N+1][N+1][propId] + vol[N+1][  N][N+1][propId] + vol[N+1][N+1][  N][propId] )/3.0 ;
}


// returns # sample along all directions
// if vData is invalid or non-regular-hexahedron,
// this returns -1.

function getDim(vol){
    return (    vol        == null
	     || vol.length != vol[0].length
	     || vol.length != vol[0][0].length)
	? -1 : vol.length ;
}

function allocateZeroVolume(_siz, dim){
    let siz = _siz ;
    dim = ( dim != null ? dim : numVxlProperties ) ;
    console.log('Volume dim: '+JSON.stringify([siz,siz,siz]));
    let xsiz , ysiz , zsiz ;
    xsiz = ysiz = zsiz = siz-2;
    let srcVolume = [];
    let zeroVoxel = [];
    for( let zvi=0;zvi<dim;++zvi ) zeroVoxel.push(0);
    for( let zi=0;zi<zsiz+2;++zi ){
	srcVolume.push([]);
	for( let yi=0;yi<ysiz+2;++yi ){
	    srcVolume[zi].push([]);
	    for( let xi=0;xi<xsiz+2;++xi ){
		// FlowX, FlowY, FlowZ, Density, Tmp
		srcVolume[zi][yi].push( Array.from(zeroVoxel) );
	    }
	}
    }
    return srcVolume ;
}

function volumeZeroFill(vol){
    vol.forEach(zvol=>{
	zvol.forEach(yvol=>{
	    yvol.forEach(xvol=>{
		xvol.filter
	    });
	})
    });
}


const StableFluid = {
    // vol : [iz][iy][ix] (should be regular cube and one-layer buffer voxel
    //       is necessary around all faces
    connect : function (vol){
        if( getDim(vol) == -1 ){
            alert('Invalid voxel data is specified for StabeFluid:connect()');
            return;
        }
        this.vol = vol;
	this._tmpVol = allocateZeroVolume(vol.length) ;
    }

        
    ,step : function( dt , _diffuse , _viscosity , srcVol){
        const diff = (_diffuse != null ? _diffuse : 1) ;
	const viscosity = (_viscosity != null ? _viscosity : 1 );
    
        let vol = this._tmpVol ;
        let volPrev = this.vol ;

        function swapVol(){
            let tmpVol = vol ; vol = volPrev ; volPrev = tmpVol ;
        }

        // Velocity step
	if( srcVol != null ){
            addSource( dt, vol, volPrev, srcVol, FlowX);
            addSource( dt, vol, volPrev, srcVol, FlowY);
            addSource( dt, vol, volPrev, srcVol, FlowZ);
            swapVol();
	} else {
	    copyVol(vol,volPrev, FlowX);
	    copyVol(vol,volPrev, FlowY);
	    copyVol(vol,volPrev, FlowZ);
	}

        diffuse( dt, vol, volPrev, FlowX, viscosity, 1 );
        diffuse( dt, vol, volPrev, FlowY, viscosity, 2 );
        diffuse( dt, vol, volPrev, FlowZ, viscosity, 3 );

        project( vol );

        swapVol();

        advect( dt, vol, volPrev, FlowX, 1 );
        advect( dt, vol, volPrev, FlowY, 2 );
        advect( dt, vol, volPrev, FlowZ, 3 );
        
        project( vol );
        swapVol();

        // Density step
	if( srcVol != null ){
            addSource( dt, vol, volPrev, srcVol, Density);
            swapVol();
	}

        diffuse( dt, vol, volPrev, Density, diff, 0 );
        swapVol();
        advect( dt, vol, volPrev, Density, 0 );
        
        
        this.vol = vol ;
	this._tmpVol = volPrev;
    }

    ,allocateZeroVolume : allocateZeroVolume

    // Consts for node.js
    ,consts:{
        numVxlProperties: numVxlProperties
	,srcVolNumProperties: srcVolNumProperties
        ,FlowX: FlowX
        ,FlowY: FlowY
        ,FlowZ: FlowZ
        ,Density: Density
        ,Temp1:Temp1
        ,Temp2:Temp2
    }

}

exports.StableFluid = StableFluid ;
