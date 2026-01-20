for(var i = 0;i < 5;i++){
    function printText(temp) {
        setTimeout(() => {
            var temp = i
            console.log(temp);
        }, 100);
    }
    printText(i)
}