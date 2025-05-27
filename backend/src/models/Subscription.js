const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  stripeCustomerId: {
    type: String,
    required: true
  },
  stripeSubscriptionId: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['none', 'active', 'cancelled'],
    default: 'none'
  },
  plan: {
    type: String,
    enum: ['free', 'premium', 'monthly'],
    default: 'free'
  },
  currentPeriodEnd: {
    type: Date,
    required: true,
    validate: {
      validator: function(v) {
        return v instanceof Date && !isNaN(v);
      },
      message: props => `${props.value} is not a valid date!`
    }
  },
  startDate: {
    type: Date,
    default: Date.now,
    validate: {
      validator: function(v) {
        return v instanceof Date && !isNaN(v);
      },
      message: props => `${props.value} is not a valid date!`
    }
  },
  endDate: {
    type: Date,
    validate: {
      validator: function(v) {
        return !v || (v instanceof Date && !isNaN(v));
      },
      message: props => `${props.value} is not a valid date!`
    }
  },
  paymentHistory: [{
    amount: Number,
    date: {
      type: Date,
      validate: {
        validator: function(v) {
          return v instanceof Date && !isNaN(v);
        },
        message: props => `${props.value} is not a valid date!`
      }
    },
    status: String
  }]
}, {
  timestamps: true
});

// Add methods to check subscription status
subscriptionSchema.methods.isActive = function() {
  const now = new Date();
  return this.status === 'active' && 
         (!this.endDate || this.endDate > now) &&
         (!this.currentPeriodEnd || this.currentPeriodEnd > now);
};

subscriptionSchema.methods.isPremium = function() {
  return (this.plan === 'premium' || this.plan === 'monthly') && this.isActive();
};

// Update user's subscription status when subscription changes
subscriptionSchema.post('save', async function(doc) {
  try {
    const User = mongoose.model('User');
    await User.findByIdAndUpdate(doc.user, {
      'subscription.status': doc.status,
      'subscription.stripeCustomerId': doc.stripeCustomerId,
      'subscription.plan': doc.plan,
      'subscription.currentPeriodEnd': doc.currentPeriodEnd
    });
  } catch (error) {
    console.error('Error updating user subscription:', error);
  }
});

// Pre-save middleware to ensure dates are valid
subscriptionSchema.pre('save', function(next) {
  if (this.currentPeriodEnd && !(this.currentPeriodEnd instanceof Date)) {
    this.currentPeriodEnd = new Date(this.currentPeriodEnd);
  }
  if (this.startDate && !(this.startDate instanceof Date)) {
    this.startDate = new Date(this.startDate);
  }
  if (this.endDate && !(this.endDate instanceof Date)) {
    this.endDate = new Date(this.endDate);
  }
  next();
});

const Subscription = mongoose.model('Subscription', subscriptionSchema);

module.exports = Subscription; 