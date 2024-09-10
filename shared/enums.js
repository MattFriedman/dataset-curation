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

    const Category = Object.freeze({
        HCL_EXAMPLE: 'hcl_example',
        DOCS: 'docs',

        values: function() {
            return Object.values(this).filter(value => typeof value === 'string');
        },

        getLabel: function(value) {
            switch(value) {
                case this.HCL_EXAMPLE: return 'HCL Example';
                case this.DOCS: return 'Documentation';
                default: return 'Invalid Category';
            }
        }
    });

    return { CreationMethod, Category };
}));
