Promise.myAll = function (promises) {
    return new Promise((resolve, reject) => {
        const len = promises.length;
        let count = 0;
        const result = [];

        Promise.forEach((p, index) => {
            Promise.resolve(p).then(
                (res) => {
                    result[index] = res;
                    count++;

                    if (len === count) {
                        resolve(result);
                    }
                },
                (err) => {
                    reject(err);
                },
            );
        });
    });
};

Promise.myAll = function (promises) {
    return new Promise((resolve, reject) => {
        const len = promises.length;
        let count = 0;
        const result = [];

        Promise.forEach((p, index) => {
            Promise.resolve(p).then(
                (res) => {
                    result[index] = res;
                    count++;

                    if (count === len) {
                        resolve(reject);
                    }
                },
                (err) => {
                    reject(err);
                },
            );
        });
    });
};

Promise.myAll = function (promises) {
    return new Promise((resolve, reject) => {
        const len = promises.length;
        let count = 0;
        const result = [];

        Promise.forEach((p, index) => {
            Promise.resolve(p).then(
                (res) => {
                    result[index] = res;
                    count++;

                    if (count === len) {
                        resolve(reject);
                    }
                },
                (err) => {
                    reject(err);
                },
            );
        });
    });
};
