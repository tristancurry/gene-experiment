

	//need a function to go between the segment's reference frame, and the environment reference frame
	//that's to simplify symmetry of control points, and replication of structures.
	//protein effects can act on either set of points, and these should update each other accordingly.






	




	let pathy = new Pathicle({name: 'pathy'});

	pathy.segments.push(new Segment('L'));
	pathy.segments[0].setPoint('start', {x:0, y:200});
	pathy.segments[0].setPoint('end', {x:100, y:200});


	let seg1 = new Segment('C');


	pathy.segments.push(seg1);

	seg1.setPoint('start', {x: 100, y: 200});
	seg1.setPoint('end', {x: 300, y: 200});

	seg1.setPoint('ecpoints0', {x:-40, y:-100});
	seg1.setPoint('ecpoints1', {x:seg1.eigenEnd.x + 40, y:-100});





	let seg2 = new Segment('L');
	seg2.setPoint('start', {x:300, y:200});
	seg2.setPoint('end', {x:400, y:200});

	pathy.segments.push(seg2);
	pathy.update();










	
	
//this step involves only the proteins that are left after binding, excretion, lysing etc
//i.e. the ones that 'get to' have direct, visible effects

let doProteinEffects = function (target) {
	//for each genetic property, create a temporary buffer.
	//for now though...work on control points
	//active proteins will be location-specific (arriving there by transport/diffusion/production)
	//work through each protein in the list. Currently there are three of these.
	let activeProteins = [{name: 'B', units: 5}];
	activeProteins.forEach(protein => {
		console.log(`Now deploying protein '${protein.name}'!`);
		if(!target.effectLookup[protein.name]) {
			//do nothing
			console.log(`Protein '${protein.name}' has no prescribed effect.`)
		} else {
			console.log(`Protein '${protein.name}' has prescribed effects.`)
			if(!target.effectLookup[protein.name]) {
				//no effect. Protein remains in structure until removed.
			} else {
				let proteinEffects = target.effectLookup[protein.name];
				proteinEffects.forEach(thisEffect => {
					let thisExpr = target.exprs[thisEffect.expr];
					let accumulator = thisExpr.val;
					console.log(thisExpr);
					let units = protein.units;
					while(units > 0) {
						accumulator = thisEffect.effect(accumulator, ...thisEffect.args);
						units -= 1;
					}
					console.log(accumulator);
					target.exprs[thisEffect.expr].val = accumulator;
					let expr = target.exprs[thisEffect.expr];
					if(expr.ref) {
							target[expr.ref[0]][expr.ref[1]][expr.ref[2]] = expr.val;
					}
					if (thisEffect.aux) {
						target[thisEffect.aux](...thisEffect.aux_args);
					}
					
				});
				protein.units = 0;		
			}
		}
	});
}



//working title. Start with one segment and see how the gene decoding goes.



//need to encode genes for
//curve type.
//control points (locations)
//curve end point
//ribosomal efficiency (energy, speed of production, error rate)
//lysosomal efficiency
//there is a limited (but very large) number of 'receptor' functions describing an effect.
//these receptors can be inhibited by the actions of certain proteins or even environmental effects.
//the receptors have a certain number of slots, too. This is subject to genetic factors too...
//start with a small, but fixed, number of receptors that have fixed slots and sensitivities
//this will be in the form of a lookup table.

//proteins look like
// CBNQPCQNBFAXNBAAANMBABB
// CB    NQPC      QNB      FAXN        BAAB										NM 						BABB
// type  receptor  strngth  receptor   	can attach to active gene sites ba and ab	spacer (one of several)	can directly bind proteins BA and BB
//bound proteins (and the binding proteins) are removed from functional processes. Not all proteins bind others.

//receptor looks like
//NQPC     ABV		bAqT     NFR          CrBr     mfL
//receptor slots    effect1  strength     effect2  strength

//individual effects drawn from expansive library of effects.
//these effects change depending on the context (e.g. tissue type)?
//so each gene needs a number of 'switches'...effectively those active gene sites.
//a protein can attach to a given switch and either enhance the gene action to a degree, or repress it
//another protein can bind to these proteins and remove them. So we have to keep track of which proteins are bound to the genes?

//create a 'protein' object, and bind to a 'gene' object.
//do we want to notionally create 'gene' objects that are then compiled into a genome for exposure to the user? I wanted this to be pretty obscure.

//active gene attachment sites allow protein mediated expression of genes. 
//receptor on gene looks like
//NQPC
//receptor 
//these can either be promoting or inhibiting receptors. This allows proteins to bind directly to these sites.
//there are also less specific protein binding sites (ab, aa, etc) that allow a multitude of different proteins to bind.

//those receptor codes could be complementary to the protein's receptor code.


//the transcription is an ongoing, dynamic process that generates proteins that have consequences for the shape
//proteins are soaked up in producing phenotypic things
//e.g. there's a gene for a C with control points a and b.
//this is transcribed into a protein that produces this effect. (NB there can be transcription errors!)
//there may be multiple transcriptions of the same gene, producing a lot of this protein
//at the same time, there's another protein being generated that produces a different C
//proteins that affect the exact same 'area' are selected from at random. Their effects are averaged.
//the selection continues until all 'slots' are used. The 'slots' are determined by the size of the structure, and genetic factors.
//excess proteins are exchanged between structures, excreted wholesale, or broken down by lysosomal action
//every action here takes energy to perform
//other excess material remains in the structure for the next round of allocations. this can end up preventing absorption into the structure
//or preventing it from producing the mix of proteins required for survival.

			
//each structure has its own number of cells which affects the protein production (more 'trials' in probability-driven transcription system)

			 
//start with assumption that each unit has ribosomes and lysosomes - later code for these in the genetic sequence.

//5 stages of growth? Timing regulated by gene activity. Different sets of genes activate at different times...
