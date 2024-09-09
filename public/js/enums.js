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
