import React, { Component} from 'react';
import './App.css';
import {
  Button,
  TextField,
  Typography,
  FormControlLabel,
  Paper,
  Divider,
  Checkbox
} from '@material-ui/core';

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      token: null,
      output: [],
      showUserInfo: false,
      customerId: '',
      user: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'John.Doe@corona.com'
      },
      card_expiry: '04/2022',
      card: {
        number: '4005562231212123',
        brand: 'VISA',
        cvv: '123',
        exp_month: '04',
        exp_year: '2022'
      }
    };
    this.callCreateTokenAPI = this.callCreateTokenAPI.bind(this);
    this.callCreateChargeAPI = this.callCreateChargeAPI.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }

  writeOutput(message){
    this.setState({ output: [...this.state.output, message]});
  }

  generateMask(cardNumber){
    const last4Digits = cardNumber.slice(-4);

    return last4Digits.padStart(cardNumber.length, '*');
  }

  callCreateTokenAPI = async () => {
    this.writeOutput('Genarating Token ...');

    const data = JSON.stringify({ card: this.state.card });
    debugger;
    const response = await fetch('/api/createToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: data,
    });

    const resp = await response.json();
    if (response.status !== 200) {
      throw Error(resp.message);
    }
    this.writeOutput(`Token Id is - ${resp.id}`);
    this.setState({
      token: resp.id,
    });
    return resp;
  };

  callCreateCustomerAPI = async () => {
    this.writeOutput(`Saving Card on File '${this.generateMask(this.state.card.number)}' for '${this.state.user.firstName} ${this.state.user.lastName}'...`);

    const data = JSON.stringify({
      source: this.state.token,
      email: this.state.user.email
    });
    const response = await fetch('/api/createCustomer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: data,
    });

    const resp = await response.json();
    if (response.status !== 200) {
      throw Error(resp.message);
    }
    let userId = resp.id;
    this.writeOutput(`Card Saved Successfully, Confirmation number - ${userId}`);
    this.setState({customerId: userId});

    return resp;
  };

  callCreateChargeAPI = async () => {
    this.writeOutput(`Charging Card '${this.generateMask(this.state.card.number)}' for $25.00...`);

    const source = this.state.showUserInfo ? this.state.customerId : this.state.token;
    const data = JSON.stringify({ source: source });

    const response = await fetch('/api/createCharge', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: data,
    });

    const resp = await response.json();
    if (response.status !== 200) {
      throw Error(resp.message);
    }
    this.writeOutput(`Payment Success, Confirmation # is - ${resp.id}`);
    return resp;
  };

  buttonHandler = e => {
    e.preventDefault();
    this.setState({output: []});

    this.callCreateTokenAPI()
      .then(() => {
        if(this.state.showUserInfo) {
          return this.callCreateCustomerAPI()
        }
      })
      .then((customerObj)=> {
        return this.callCreateChargeAPI()
      })
      .catch(err => console.log(err));


    // if(this.state.showUserInfo) {
    //   return this.callCreateTokenAPI().then((tokenResp) => {
    //     return this.callCreateCustomerAPI()
    //   }).then((customerObj)=> {
    //     this.callCreateChargeAPI()
    //   }).catch(err => console.log(err));
    // } else {
    //   this.callCreateTokenAPI().then((tokenResp) => {
    //     this.callCreateChargeAPI()
    //   }).catch(err => console.log(err));
    // }
  };

  handleCheckbox = event => {
    let checkboxState = event.target.checked;

    this.setState({showUserInfo: checkboxState});
  };

  handleChange = (event) => {
    let value = event.target.value;
    debugger;
    if(event.target.id === 'card-number'){
      this.setState(prevState => {
        let card = { ...prevState.card };
        card.number = value;
        return { card };
      })
    }
    if(event.target.id === 'card-cvv') {
      this.setState(prevState => {
        let card = {...prevState.card};
        card.cvv = value;
        return {card};
      })
    }
    if(event.target.id === 'card-date') {
      let monthValue, yearValue;
      const tokens = value.split("/");
      // don't set the state if there is more than one "/" character in the given input
      if(tokens.length < 3) {
        const month = Number(tokens[0]);
        const year = Number(tokens[1]);
        //don't set the state if the first two letter is not a valid month
        if (month >= 1 && month <= 12) {
          //I used lodash for padding the month and year with  zero
          monthValue = month.toString().padStart(2, "0");
          //disregard changes for invalid years
          if (year > 2019 && year <= 2100) {
            yearValue = year.toString();
          }
        }
      }
      this.setState(prevState => {
        let card = {...prevState.card};
        card.exp_month = monthValue;
        card.exp_year = yearValue;
        return {card};
      })
    }
  };

  render() {
    return (
        <div className="App">
          <Typography variant="h6" gutterBottom>
            Deepali's Book Shop
          </Typography>
          <header className="App-header">
            <div className="flex justify-center mt-16">
              <div id="card-errors" role="alert"></div>
              <form id="payment-form" noValidate autoComplete="off">
                <fieldset className="FormGroup">
                  <div className="FormRow">
                    <TextField id="card-number" className="field card-number" label="Card Number" fullWidth variant="filled" onChange={this.handleChange} value={this.state.card.number} />
                  </div>
                  <div className="FormRow">
                    <TextField id="card-date" className="field third-width" label="Expiration (MM/YYYY)" variant="filled" onChange={this.handleChange} defaultValue={this.state.card_expiry} />
                    <TextField id="card-cvv" className="field third-width" label="CVV" variant="filled" onChange={this.handleChange} value={this.state.card.cvv} />
                  </div>
                  <FormControlLabel
                      control={<Checkbox color="secondary" name="saveCard" value="yes" onChange={this.handleCheckbox} />}
                      label="Save Card on File for next time"
                  />
                </fieldset>
              </form>

              {this.state.showUserInfo && (
                  <form id="user-Info" noValidate autoComplete="off" >
                    <fieldset className="FormGroup">
                      <div className="FormRow">
                        <TextField id="user-firstname" className="field third-width" label="First Name" variant="filled" defaultValue={this.state.user.firstName} />
                        <TextField id="user-lastname" className="field third-width" label="Last Name" variant="filled"  defaultValue={this.state.user.lastName} />
                      </div>
                      <div className="FormRow">
                        <TextField id="user-email" className="field card-number" label="Email" fullWidth variant="filled" defaultValue={this.state.user.email} />
                      </div>
                    </fieldset>
                  </form>
              )}
              <Button variant="contained" color="primary" size="large" onClick={this.buttonHandler}>
                Pay $25.00
              </Button>
            </div>
            <Divider variant="middle" />
            <div className="flex justify-center mt-16">
              <Paper elevation={3} id="output-area">
                {this.state.output.map((item, key) =>
                  <p key={key}>{item}</p>
                )}
              </Paper>
            </div>
          </header>
        </div>
    );
  }
}

export default App;