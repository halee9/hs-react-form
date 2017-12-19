import React, { Component } from 'react';
import _ from 'lodash';

const validateField = (value, rules) => {
  let error = false;
  for (let i=0; i<rules.length; i++){
    if (rules[i]){
      error = rules[i](value);
      if (error) {
        return error;
      }
    }
  }
  return error;
}

export function withForm(rules){
  return function(WrappedComponent){
    return class extends Component {
      onValidates = _.reduce(rules, (acc, rule, key) => {
        acc[key] = false;
        return acc;
      },{});
      validFields = _.reduce(rules, (acc, rule, key) => {
        acc[key] = rule[0] ? false : true;
        return acc;
      },{});
      state = {
        values: {},
        errors: {},
        validForm: false,
      }
      rules = rules;
      chainRules = {};

      validate = (items, callback) => {
        let errors = {};
        let values = {};
        let newItems = [];

        items.forEach(item => {
          const { name, value } = item;
          newItems.push(item);
          if (this.chainRules[name]){
            const [dest, fn] = this.chainRules[name];
            newItems.push({ name: dest, value: this.state.values[dest]});
            this.rules[dest] = fn(this.state.values[name] || '');
          }
        });

        newItems.forEach(item => {
          const { name, value } = item;
          let error = '';
          const rules = this.rules[name];
          if (_.isArray(rules)){
            error = validateField(value, rules);
            this.validFields[name] = error ? false : true;
          }
          errors[name] = error;
          values[name] = value;
        });
        this.setState({ 
          values: { ...this.state.values, ...values },
          errors: { ...this.state.errors, ...errors },
          validForm: _.every(this.validFields)
        }, () => {
          // console.log("after set state")
          if (callback) callback();
        });
      }
      
  
      componentDidMount(){
        this.setState({ validForm: _.every(this.validFields) });
      }

      handleFetchedData = (values, validate=false) => {
        const data = _.map(values, (value, name) => {
          return { name, value };
        });
        if (validate) this.validate(data);
        else this.setState({ 
          values: { ...this.state.values, ...values }
        });
      }
  
      handleSubmit = (e, callback) => {
        if (e) e.preventDefault();
        const elements = e.target.elements;
        const data = _.filter(elements, e => e.type !== 'submit').map(e => {
          return { name: e.name, value: e.value };
        });
        this.validate(data, callback(this.state.validForm));
      }
    
      handleChange = e => {
        // console.log("On Change event")
        const { name, value, type } = e.target;
        if (type === 'select-one') this.onValidates[name] = true;
        if (this.onValidates[name]) {
          let data = [ { name, value }];
          this.validate(data, () => {
          });
        }
        else {
          this.setState({ values: { ...this.state.values, [name]: value }});
        }
      }
    
      handleBlur = (e) => {
        // console.log("Event blurrrr")
        // if (e) e.stopPropagation();
        const { name, value } = e.target;
        this.onValidates[name] = true;
        const data = [ { name, value }];
        this.validate(data);
      }

      ruleChanged = (rule) => {
        this.chainRules = rule;
      }
  
      render(){
        return (
          <WrappedComponent
            { ...this.props }
            values={this.state.values}
            errors={this.state.errors}
            validFields={this.validFields}
            validForm={this.state.validForm}
            handleChange={this.handleChange}
            handleBlur={this.handleBlur}
            handleSubmit={this.handleSubmit}
            handleFetchedData={this.handleFetchedData}
            ruleChanged={this.ruleChanged}
          />
        )
      }
    }  
  }
}