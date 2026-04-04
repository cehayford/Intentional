import { useState, useEffect } from 'react'
import { budgetsAPI } from '../../api/client'
import './BudgetRuleSelector.css'

export default function BudgetRuleSelector({ selectedRuleId, onRuleChange, customPercentages, onCustomPercentagesChange }) {
  const [rules, setRules] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCustom, setShowCustom] = useState(false)
  const [customForm, setCustomForm] = useState({
    needsPercentage: 50,
    wantsPercentage: 30,
    savingsPercentage: 20
  })

  useEffect(() => {
    loadRules()
  }, [])

  useEffect(() => {
    if (customPercentages) {
      setCustomForm(customPercentages)
      setShowCustom(true)
    }
  }, [customPercentages])

  const loadRules = async () => {
    try {
      const { data } = await budgetsAPI.getBudgetRules()
      setRules(data)
      
      // Set default rule if none selected
      if (!selectedRuleId && data.length > 0) {
        const defaultRule = data.find(r => r.isDefault) || data[0]
        onRuleChange(defaultRule.id)
      }
    } catch (error) {
      console.error('Failed to load budget rules:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRuleSelect = (ruleId) => {
    if (ruleId === 'custom') {
      setShowCustom(true)
      onRuleChange(null)
    } else {
      setShowCustom(false)
      onRuleChange(ruleId)
      onCustomPercentagesChange(null)
    }
  }

  const handleCustomPercentageChange = (field, value) => {
    const numValue = Math.max(0, Math.min(100, Number(value) || 0))
    const newForm = { ...customForm, [field]: numValue }
    setCustomForm(newForm)
    
    // Auto-balance to ensure sum is 100
    const total = newForm.needsPercentage + newForm.wantsPercentage + newForm.savingsPercentage
    if (total !== 100) {
      const diff = 100 - total
      // Adjust savings to balance
      newForm.savingsPercentage = Math.max(0, Math.min(100, newForm.savingsPercentage + diff))
      setCustomForm(newForm)
    }
    
    onCustomPercentagesChange(newForm)
  }

  const selectedRule = rules.find(r => r.id === selectedRuleId)
  const isCustomSelected = showCustom || !selectedRuleId

  if (loading) {
    return (
      <div className="budget-rule-selector">
        <div className="loading-spinner">Loading budget rules...</div>
      </div>
    )
  }

  return (
    <div className="budget-rule-selector">
      <label className="form-label">Budget Rule</label>
      
      <div className="rule-options">
        {rules.map(rule => (
          <div key={rule.id} className="rule-option">
            <label className="radio-label">
              <input
                type="radio"
                name="budgetRule"
                value={rule.id}
                checked={selectedRuleId === rule.id}
                onChange={() => handleRuleSelect(rule.id)}
                className="radio-input"
              />
              <div className="rule-content">
                <div className="rule-name">{rule.name}</div>
                <div className="rule-percentages">
                  {rule.needsPercentage}% Needs / {rule.wantsPercentage}% Wants / {rule.savingsPercentage}% Savings
                </div>
                {rule.description && (
                  <div className="rule-description">{rule.description}</div>
                )}
              </div>
            </label>
          </div>
        ))}
        
        <div className="rule-option">
          <label className="radio-label">
            <input
              type="radio"
              name="budgetRule"
              value="custom"
              checked={isCustomSelected}
              onChange={() => handleRuleSelect('custom')}
              className="radio-input"
            />
            <div className="rule-content">
              <div className="rule-name">Custom Rule</div>
              <div className="rule-percentages">Create your own percentages</div>
            </div>
          </label>
        </div>
      </div>

      {showCustom && (
        <div className="custom-rule-form">
          <h4>Custom Percentages</h4>
          <div className="percentage-inputs">
            <div className="percentage-input-group">
              <label className="percentage-label">Needs (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={customForm.needsPercentage}
                onChange={(e) => handleCustomPercentageChange('needsPercentage', e.target.value)}
                className="percentage-input"
              />
            </div>
            
            <div className="percentage-input-group">
              <label className="percentage-label">Wants (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={customForm.wantsPercentage}
                onChange={(e) => handleCustomPercentageChange('wantsPercentage', e.target.value)}
                className="percentage-input"
              />
            </div>
            
            <div className="percentage-input-group">
              <label className="percentage-label">Savings (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={customForm.savingsPercentage}
                onChange={(e) => handleCustomPercentageChange('savingsPercentage', e.target.value)}
                className="percentage-input"
              />
            </div>
          </div>
          
          <div className="percentage-total">
            Total: {customForm.needsPercentage + customForm.wantsPercentage + customForm.savingsPercentage}%
            {(customForm.needsPercentage + customForm.wantsPercentage + customForm.savingsPercentage) !== 100 && (
              <span className="warning">Must equal 100%</span>
            )}
          </div>
        </div>
      )}

      {selectedRule && (
        <div className="selected-rule-summary">
          <strong>Selected:</strong> {selectedRule.name}
          <div className="rule-breakdown">
            Needs: {selectedRule.needsPercentage}% | 
            Wants: {selectedRule.wantsPercentage}% | 
            Savings: {selectedRule.savingsPercentage}%
          </div>
        </div>
      )}
    </div>
  )
}
