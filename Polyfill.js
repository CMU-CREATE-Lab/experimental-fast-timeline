/**
 * Polyfill for emulating Math.log2 function
 * from http://mzl.la/1Ne7YQn
 * @param  {number} x
 * @return {number}
 */

Math.log2 = Math.log2 ||
            function(x) {
                return Math.log(x) / Math.LN2;
            };

/**
 * Polyfill for emulating Math.log10 function
 * from http://mzl.la/1NBg7v7
 * @param  {number} x
 * @return {number}
 */
Math.log10 = Math.log10 ||
             function(x) {
                 return Math.log(x) / Math.LN10;
             };
