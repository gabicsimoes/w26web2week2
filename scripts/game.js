/*
	1. Add local storage ability to the setStats function
	2. Add input element in HTML for username
	3. Add blur event listener for element (and change the object player from const to let)
	4. Add check on buttons so a blank user can't play
*/

//object to store player information
let player = {
	"Name": "",
	"Score": 0,
	"CombinedScore": 0,
	"GameStats": {
		"Easy": [0,0],
		"Normal": [0,0],
		"Hard": [0,0],
		"Impossible": [0,0]
	}
}

//difficulty holds the speed of the block, which can be set to tailor the difficulty to your liking
const difficulty = {
	"Easy": 4800,
	"Normal": 4000,
	"Hard": 3200,
	"Impossible": 2400
}

//the number to divide the time into, in order to get the score for each block (so the higher you go in level or stacking, the higher the score)
const scoreFactor = 240000;

//speed will control how long the block takes to get from one side to the other
//it needs to be divisible by 8 (and will be set based on difficulty level the user chooses)
let speed;

//level will hold which level of difficulty this is
let level;

//a bolean to pause the game when overlays are active
let playing = false;

//create the game board (generate squares)
createBackground();
function createBackground(){
	const bgTemplate = `<div class="bg-block"></div>`;
	const background = document.querySelector(".game");
	for(let i=0; i<56; i++){
		background.innerHTML += bgTemplate;
	}
}

//launch welcome overlay so the user can choose the level
overlay("welcome");


//----------------------------- game playing functions --------------------------------------//
function setStats(){
	const statContainer = document.querySelector(".stats");

	//build a template literal for the stats
	const template = `<h3>${player.Name}'s Stats</h3>
						<p class="score">Game Score: ${player.Score}</p>
						<p class="combined">Total Score: ${player.CombinedScore}</p>
						<h5 class="diffs">Difficulty Stats:</h5>
						<h6>Easy</h6>
						<p><span>Wins: ${player.GameStats.Easy[0]}</span><span>Loses: ${player.GameStats.Easy[1]}</span></p>
						<h6>Normal</h6>
						<p><span>Wins: ${player.GameStats.Normal[0]}</span><span>Loses: ${player.GameStats.Normal[1]}</span></p>
						<h6>Hard</h6>
						<p><span>Wins: ${player.GameStats.Hard[0]}</span><span>Loses: ${player.GameStats.Hard[1]}</span></p>
						<h6>Impossible</h6>
						<p><span>Wins: ${player.GameStats.Impossible[0]}</span><span>Loses: ${player.GameStats.Impossible[1]}</span></p>`;

	statContainer.innerHTML = template;

	//now add the data to the local storage
	const playerString = JSON.stringify(player);
	localStorage.setItem(player.Name, playerString);
}

document.querySelector("body").addEventListener("keydown", function(event){
	if(event.code === "Space" && playing === true){
		//stop the current block and keep it at its current position
		const block = document.querySelector(".active .block");
		const blockStyles = getComputedStyle(block);
		const blockLeft = parseInt(blockStyles.left);
		const blockWidth = parseInt(blockStyles.width);
		document.querySelector(".active").classList.remove("active");
		block.style.left = blockLeft + "px";

		//calculate score before reducing speed
		const score = Math.floor(scoreFactor / speed);
		//reduce speed (for the next stacker row)
		speed -= difficulty[level]/8;

		//if this is not the first row, check if there is a win or a stack
		if(document.querySelector("#stacker").children.length > 1){
			//check position of block below, and if this is the 8th row, check for a win
			const lastBlock = block.parentNode.previousElementSibling.querySelector(".block");
			const lastBlockPos = parseInt(getComputedStyle(lastBlock).left);

			//calculate whether or not the last block is actually touching the current block (directly stack on top)
			if(blockLeft > (lastBlockPos-blockWidth-1) && blockLeft < (lastBlockPos+blockWidth-1)){
				//set the score
				player.Score += score;
				player.CombinedScore += score;
				setStats();

				//a stack was made, so the game keeps going, but we need to check for a win...
				if(speed === 0){
					//if speed is 0, this is the last row, and the user has won
					//count a win based on level, and adjust the stats
					player.GameStats[level][0]++;
					setStats();
					//trigger the overlay and stop the function with return
					overlay("win");
					return true;
				}
			}else{
				//if not a stack, the game is lost
				//count a loss based on level, and adjust the stats
				player.GameStats[level][1]++;
				setStats();
				//trigger the overlay and stop the function with return
				overlay("lose");
				return false;
			}	
		}else{
			//if this is the first row, just aware points
			player.Score += score;
			player.CombinedScore += score;
			setStats();
		}

		//generate a new row, if we're still playing (because either the lose or win returns haven't triggered)
		//set the new block's animation speed and animation delay (to control which side of the board the block starts on)
		delay = blockLeft < 180 ? -(speed/2) : 0;
		const rowTemplate = `<div class="row active"><span class="block" style="animation-duration:${speed}ms; animation-delay:${delay}ms;"></span></div>`;
		const gameStacker = document.querySelector("#stacker");
		gameStacker.innerHTML += rowTemplate;
	}
});

// -------------------- overlay functions ------------------------- //
document.querySelector(".overlay input").addEventListener("blur", function(){
	//check if the value is blank
	if(!this.value){
		this.classList.add("error");
	}else{
		//remove error class
		this.classList.remove("error");
		//try to get the user from local storage
		const userData = localStorage.getItem(this.value);

		if(userData){
			//if there is such a user, set the object to be that user
			player = JSON.parse(userData);
		}else{
			//if it's a new user, we have to set the user's name, and add that user name to the stats
			player.Name = this.value;
			setStats();
		}
	}
});

function overlay(h2Class){
	//pause any playing if an overlay is active
	playing = false;

	//show the overlay
	document.querySelector(".overlay").classList.add("show");

	//show the appropriate header
	document.querySelector("." + h2Class).classList.add("show");

	if(h2Class === "welcome"){
		//add event listeners to the buttons, but only if this is the first time here (or after page refresh)
		//use event delegation so there aren't multiple listeners
		document.querySelector(".difButtons").addEventListener("click", function(event){
			const userInput = document.querySelector(".overlay input");
			if(!userInput.value){
				userInput.classList.add("error");
			}else if(event.target.classList.contains("dif")){
				//set the speed and level variables for difficulty
				level = event.target.textContent;
				speed = difficulty[event.target.textContent];

				//set the title to indicate the difficulty
				document.querySelector("header h4").textContent = "Difficulty: " + level;

				//reset game score
				player.Score = 0;
				//set up the stats based on the game object
				setStats();

				//set the game to start
				playing = true;				
                const gameTemplate = `<div class="row active"><span class="block" style="animation-duration:${speed}ms;"></span></div>`;
				document.querySelector("#stacker").innerHTML = gameTemplate;

				//hide the overlay
				document.querySelector(".overlay").classList.remove("show");
				document.querySelector("h2.show").classList.remove("show");
			}
		});
	}
}