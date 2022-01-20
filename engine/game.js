
//everything column major order
function movesLeft(board){
    let length = board.length;
    let retVal =  false;
    
    for(let i = 0; i<length;i++){
        for(let j=0;j<length;j++){
            let values = [];
            if(board[i-1]!= undefined){
                if(board[i-1][j] != undefined){
                    values.push(board[i-1][j]);
                }
            }
            if(board[i+1]!= undefined){
                if(board[i+1][j] != undefined){
                    values.push(board[i+1][j]);
                }
            }
            if(board[i]!= undefined){
                if(board[i][j-1] != undefined){
                    values.push(board[i][j-1]);
                }
            }
            if(board[i]!= undefined){
                if(board[i][j+1] != undefined){
                    values.push(board[i][j+1]);
                }
            }
            // console.log("at " + board[i][j]+ " adjacent are " +values);
            // console.log(values.includes(board[i][j]));
            // console.log(values.includes(0));

            if(values.includes(board[i][j]) || values.includes(0)){
                return true;
            }
        }
    }
    return retVal;
}

const emit=(event,object)=>{
    for(const callback of object['_'+event]){
        if(callback){
            callback(object.gameState)
        }
    }
}

export default class Game {
    constructor(dim) {
        this.dim = dim;
        this._onMove = [];
        this._onWin = [];
        this._onLose = [];
        this.setupNewGame();
    };

    //1. setup new game
    setupNewGame(){
        this.board = create2DArray(this.dim);
        this.score = 0;
        this.won = false;
        this.over = false;
        this.addTile();
        this.addTile();

        let max = 0;
        for(let i = 0;i<this.dim;i++){
            for(let j = 0;j<this.dim;j++){
                if(this.board[i][j] > max){
                    max = this.board[i][j];
                }
            }
        }
        this.maxInit = max;
    }

    //2. loadGame(gameState)
    loadGame(gameState) {
        this.score = gameState.score;
        this.won = gameState.won;
        this.over = gameState.over;

        for(let i=0;i<this.dim;i++){
            for(let j=0;j<this.dim;j++){
                this.board[i][j]=gameState.board[(this.dim*i)+j];
                if(this.board[i][j] == 2048){
                    this.won = true;
                    emit('onWin', this);
                }
            }
        }
        

        if(movesLeft(this.board)){
            this.over = false;
        } else{
            this.over = true;
            emit('onLose',this);
        }

        
    }

    //3. move
    move(direction) {
        let board = this.board;
        let moved;
        switch (direction) {
            case 'left':
                //shift all values to left
                moved = this.shiftLeft(board);
                this.addLeft(board);
                this.shiftLeft(board);
                break;
            case 'right':
                this.rotate();
                this.rotate();
            //easiest way is to create rotate matrix helper function
                moved = this.shiftLeft(board);
                this.addLeft(board);
                this.shiftLeft(board);
                this.rotate();
                this.rotate();
                break;
            case 'up':
                this.rotate();
                this.rotate();
                this.rotate();
                moved = this.shiftLeft(board);
                //add all equal values in left order
                this.addLeft(board);
                this.shiftLeft(board);
                this.rotate();
                break;
            case 'down':
                this.rotate();
                moved = this.shiftLeft(board);
                this.addLeft(board);
                this.shiftLeft(board);
                this.rotate();
                this.rotate();
                this.rotate();
                break;
        }

        for(let i=0;i<this.dim;i++){
            for(let j=0; j<this.dim;j++){
                if(this.board[i][j] == 2048){
                    this.won = true;
                    console.log("won!");
                    emit('onWin', this);
                }
            }
        }
        
        if(movesLeft(this.board)){
            this.over = false;
            if(moved){
                this.addTile();
                if(!movesLeft(this.board)){
                    this.over= true;
                    console.log("over!");
                    emit('onLose', this);
                }
            }
            
        } else{
            this.over = true;
            console.log("over!");
            emit('onLose', this);
            return;
        }

        
        console.log("score after moving is " + this.score);

        emit('onMove', this);
    }

    //helper functions for move-----------------
    
    addLeft(board){
        let length = board.length;
        for (let row = 0; row < length; row++) {
            for (let col = 0; col < length; col ++) {
                if(board[row][col] == board[row][col+1]){
                    board[row][col] +=board[row][col+1];
                    this.score += board[row][col];
                    board[row][col+1] = 0;
                }
            }
        }
    }

    shiftLeft(board) {
        let length = board.length;
        let replaced = false;
        for (let row = 0; row < length; row++) {
            for (let col = 0; col < length; col++) {
                let emptyfound = false;
                let first0;
                let nextfill;

                let colMove = 0;
                let found = false;

                for (let colMove = 0; colMove < length; colMove++) {
                    if (board[row][colMove] == 0 && !emptyfound) {
                        emptyfound = true;
                        first0 = colMove;
                    } else if (emptyfound && board[row][colMove] != 0) {
                        nextfill = colMove;
                        found = true;
                    };
                    if (found) {
                        break;
                    }
                }

                if (nextfill != undefined) {
                    board[row][first0] = board[row][nextfill];
                    board[row][nextfill] = 0;
                    replaced = true;
                }

                

            }
        }
        return replaced;
    }

    // this rotates board clockwise
    rotate(){
        let matrix = this.board;
        let n = matrix.length;
        for(let layer = 0; layer < n/2;layer++){
            let first = layer;
            let last = n-1-layer;
            for(let i = first; i < last; i++){
                let offset = i-first;
                let top = matrix[first][i];
                matrix[first][i] = matrix[last-offset][first];
                matrix[last-offset][first]=matrix[last][last-offset];
                matrix[last][last-offset]=matrix[i][last];
                matrix[i][last]=top;
            }
        }
    }
    //------------------------------------------


    //4. toString
    toString() {
        let length = this.board.length;
        let str = '';
        for (let i = 0; i < length; i++) {
            for (let j = 0; j < length; j++) {
                str = str + "[" + this.board[i][j] + "]";
            }
            str = str + "\n";
        }
        return str;
    }

    //5. onMove
    onMove(callback){
        this._onMove.push(callback);
    }

    //6. onWin
    onWin(callback){
        this._onWin.push(callback);
    }
    //7. onLose
    onLose(callback){
        this._onLose.push(callback);
    }
    //8. getGameState
    getGameState(){
        let length = this.dim;
        let b = [];
        for(let i =0; i<length;i++){
            for(let j =0;j<length;j++){
                b.push(this.board[i][j]);
            }
        }
        let gs = {
            board: b,
            score: this.score,
            won: this.won,
            over: this.over
        }
        return gs;
    }

    addTile() {
        let randInt = Math.random();
        let value;
        if (randInt < .9) {
            value = 2;
        } else {
            value = 4;
            
        };

        let randAdd = Math.floor(Math.random() * this.dim * this.dim);
        let j = Math.floor(randAdd / this.dim);
        let i = randAdd % this.dim;
        if (this.board[i][j] == 0) {
            this.board[i][j] = value;
        } else {
            this.addTile();
        }

        if(movesLeft(this.board)){
            this.over = false;
        } else{
            this.over = true;
        }
    };


}

let k = new Game(4);

// let gs = {
//     board: [
//         0, 0, 0,  0, 0, 2,
//         0, 0, 0,  0, 0, 0,
//         0, 0, 2, 2
//       ],
//       score: 44,
//       won: false,
//       over: false
// }
// k.loadGame(gs);
console.log("maxinit" + k.maxInit);
console.log(k.toString());

k.move("right");
console.log(k.toString());
console.log(k.getGameState().score);
k.move("left");
console.log(k.toString());
console.log(k.getGameState().score);
k.move("right");
console.log(k.toString());
console.log(k.getGameState().score);
k.move("left");
console.log(k.toString());
console.log(k.getGameState().score);
k.move("right");
console.log(k.toString());
console.log(k.getGameState().score);



function create2DArray(rows) {

    var arr = new Array(rows);


    for (var i = 0; i < arr.length; i++) {
        arr[i] = new Array(rows);
    }

    for (var i = 0; i < arr.length; i++) {
        for (var j = 0; j < arr.length; j++) {
            arr[i][j] = 0;
        }
    }

    return arr;
}
