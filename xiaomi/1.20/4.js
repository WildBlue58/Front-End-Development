for(var i = 0;i < 5;i++){
    function printText(temp) {
        var temp = i
        setTimeout(() => {
            console.log(temp);
        }, 100);
    }
    printText(i)
}