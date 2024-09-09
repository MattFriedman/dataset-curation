(function(root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.Enums = factory();
    }
}(typeof self !== 'undefined' ? self : this, function() {

    const CreationMethod = Object.freeze({
        MANUAL: 'manual',
        AUGMENTED_PARAPHRASED: 'augmented:paraphrased',
        UNKNOWN: null,

        values: function() {
            return Object.values(this).filter(value => typeof value === 'string' || value === null);
        },

        getLabel: function(value) {
            switch(value) {
                case this.MANUAL: return 'Manual';
                case this.AUGMENTED_PARAPHRASED: return 'Augmented: Paraphrased';
                case this.UNKNOWN: return 'Unknown';
                default: return 'Invalid Creation Method';
            }
        }
    });

    return { CreationMethod };
}));
