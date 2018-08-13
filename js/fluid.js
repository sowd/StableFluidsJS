// Implements Stam's Stable Fluid


// Add source information (in 'SourceDensity' element of each voxel)
// to the Density of the volume.
function addSource(dt,vol, srcPropId, tgtPropId){
    const N = vol.length-2;
    for( let iz=1 ; iz<=N ; ++iz){
        for( let iy=1 ; iy<=N ; ++iy ){
            for( let ix=1 ; ix<=N ; ++ix ){
                let vxl = vol[iz][iy][ix];
                vxl[tgtPropId] += dt * vxl[srcPropId] ;
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
        for( let iz=0 ; iz<N ; ++iz){
            for( let iy=0 ; iy<N ; ++iy ){
                for( let ix=0 ; ix<N ; ++ix ){
                    let voxel = vol[iz][iy][ix];
                    voxel[propId] += voxel[Temp1] ;
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
                const voxel = vol[iz][iy][ix];

                let x = ix - dt0*voxel[FlowX];
                let y = iy - dt0*voxel[FlowY];
                let z = iz - dt0*voxel[FlowZ];
                if( x < 0.5 ) x = 0.5 ; if( x > N+0.5) x = N+0.5 ;
                if( y < 0.5 ) y = 0.5 ; if( y > N+0.5) y = N+0.5 ;
                if( z < 0.5 ) z = 0.5 ; if( z > N+0.5) z = N+0.5 ;
		const x0 = Math.floor(x), y0 = Math.floor(y), z0 = Math.floor(z);
                const px = x-x0, py = y-y0, pz = z-z0 ;

		voxel[propId] =
		    (1-pz)*((1-py)*((1-px)*vp[iz  ][iy  ][ix][propId] + px*vp[iz  ][iy  ][ix+1][propId])
			    +  py *((1-px)*vp[iz  ][iy+1][ix][propId] + px*vp[iz  ][iy+1][ix+1][propId]))
		    +  pz *((1-py)*((1-px)*vp[iz+1][iy  ][ix][propId] + px*vp[iz+1][iy  ][ix+1][propId])
			    +  py *((1-px)*vp[iz+1][iy+1][ix][propId] + px*vp[iz+1][iy+1][ix+1][propId])) ;
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

const StableFluid = {
    // vol : [iz][iy][ix] (should be regular cube and one-layer buffer voxel
    //       is necessary around all faces
    connect : function (vol){
        if( getDim(vol) == -1 ){
            alert('Invalid voxel data is specified for StabeFluid:connect()');
            return;
        }
        this.vol = vol ;
    }
    ,step : function( dt ){
        const volPrev = JSON.parse( JSON.stringify(this.vol) ) ;
	const diff = 1 , b = 0 ;

	let vol = this.vol ;

	// Velocity step
        addSource( dt, vol, SourceFlowX, FlowX);
        addSource( dt, vol, SourceFlowY, FlowY);
        addSource( dt, vol, SourceFlowZ, FlowZ);

	let tmpVol = vol ; vol = volPrev ; volPrev = tmpVol ; // Swap
        diffuse( dt, vol, volPrev, FlowX, diff, 0 );
        diffuse( dt, vol, volPrev, FlowY, diff, 0 );
        diffuse( dt, vol, volPrev, FlowZ, diff, 0 );

	project( vol );

	tmpVol = vol ; vol = volPrev ; volPrev = tmpVol ; // Swap
	advect( dt, vol, volPrev, FlowX, 1 );
	advect( dt, vol, volPrev, FlowY, 2 );
	advect( dt, vol, volPrev, FlowZ, 3 );

	project( vol );


        // Density step
        addSource( dt, vol, SourceDensity, Density);
	let tmpVol = vol ; vol = volPrev ; volPrev = tmpVol ; // Swap
        diffuse( dt, vol, volPrev, Density, diff, 0 );
	tmpVol = vol ; vol = volPrev ; volPrev = tmpVol ; // Swap
	advect( dt, vol, volPrev, Density, 0 );


	this.vol = vol ;
    }
}

