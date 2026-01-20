for (var i = 0; i < 5; i++){
    function printText(temp) {
        setTimeout(() => {
            console.log(temp);
        }, 100);
    }
    printText(i)
}