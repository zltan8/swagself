import React, { Component } from 'react';
import { Row, Col, Container, Button } from 'react-bootstrap';
import STLViewer from 'stl-viewer'
import AWS from 'aws-sdk';
import './App.css';

AWS.config.update({
  region: 'ap-southeast-1',
  accessKeyId: 'AKIA4XIQLWAJZP46FXUL',
  secretAccessKey: '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'
});

var db = new AWS.DynamoDB.DocumentClient();

class App extends Component {
  state = {
    id: 0,
    stlUrl: 'https://s3-ap-southeast-1.amazonaws.com/swagself/food.stl',
    imgUrl: 'https://s3-ap-southeast-1.amazonaws.com/swagself/1555640883266.png',
    name: '',
    loadedName: '',
    loading: false,
    submitted: 0,
    gl: {}
  }

  scrollToBottom = () => {
    this.inputRef.scrollIntoView({ behavior: "smooth" });
  }
  
  componentDidMount() {
    this.scrollToBottom();

    this.httpGetAsync('https://ipapi.co/json/', (resp) => {
      var json = JSON.parse(resp);
      Object.keys(json).forEach((key) => {
        (json[key] === null || json[key] === undefined) && delete json[key];
      });
      this.state.gl = json;

      console.log('gl', json);
    });
  }
  
  componentDidUpdate() {
    this.scrollToBottom();
  }

  isMobile = () => { return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent); }

  submit = () => {
    if (!this.validate()) return;

    var timeId = new Date().getTime();
    this.setState({ 
      id: new Date().getTime(),
      loadedName: this.state.name,
      loading: true,
      submitted: this.state.submitted + 1,
      stlUrl: '',
      imgUrl: ''
    });

    var params = {
      TableName: 'fbkeychain',
      Item: {
        timestamp: timeId,
        name: this.state.name,
        geo: this.state.gl
      }
    };

    console.log('save', params);

    db.put(params, (err, data) => {

      if (err) {
        this.setState({
          id: 0,
          name: '',
          loading: false
        });
        window.alert(err.message);
      } else {
        var retries = 0;

        var poller = setInterval(() => {
          if (retries > 10) {
            clearInterval(poller);
            window.alert('Server not responding');
          }

          db.get({
            TableName: 'fbkeychain',
            Key: {
              timestamp: this.state.id,
              name: this.state.loadedName
            }
          }, (err, data) => {
            if (err) {
              clearInterval(poller);
              window.alert(err.message);
            } else {
              console.log('test', data);
              if (data.Item.stlUrl) {
                clearInterval(poller);
                this.setState({
                  id: 0,
                  name: '',
                  stlUrl: data.Item.stlUrl,
                  imgUrl: data.Item.imageUrl,
                  loading: false
                });
              }
            }
          });

          retries++;

        }, 1000);

      }
    });
  }

  validate = () => {
    if (this.state.name.length < 2) {
      window.alert('Name must be at least 2 characters')
      return false;
    }

    if (this.state.name.length > 10) {
      window.alert('Due to limitation of printer, name cannot exceed 10 characters')
      return false;
    }

    return true;
  }

  download = () => {
    var win = window.open(this.state.stlUrl, '_blank');
    win.focus();
  }

  input = (evt) => {
    this.setState({ name: evt.target.value })
  }

  httpGetAsync = (theUrl, callback) => {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() { 
      if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
        callback(xmlHttp.responseText);
    }
    xmlHttp.open("GET", theUrl, true); // true for asynchronous 
    xmlHttp.send(null);
  }

  render() {
    return (
      <div className="App">
        <header className="App-header">
          <Container className="padding-bottom">
            <Row className="margin-bottom">
              <img className="int-ctr" src={ require('./images/logo.png') } ref={this.imgViewerRef} />
            </Row>
            <Row className="margin-bottom" style={{padding: 1, color: 'black' }} >
              <div className="int-ctr" > This is swagself. </div>
            </Row>
            <Row className="margin-bottom">
              {/* <Col sm={12} md={6} className="crop fill" hidden={!this.state.imgUrl}>
                <img className="int-ctr" src={this.state.imgUrl} ref={this.imgViewerRef} />
              </Col> */}
            {/* <Col sm={12} md={6} className="crop fill" hidden={!this.state.stlUrl}> */}
              <STLViewer
                className="int-ctr"
                url={this.state.stlUrl}
                width={460}
                height={460}
                modelColor='#3b5998'
                backgroundColor='#203A43'
                rotate={true}
                orbitControls={true}
              />
            {/* </Col> */}
            </Row>
            <Row className="margin-bottom" style={{padding: 1}} >
              <div className="int-ctr" > 1. Key in your name, wait for it to load. (Advice: Use all caps) </div>
            </Row>
            <Row className="margin-bottom" style={{padding: 1}} >
              <div className="int-ctr" > 2. Check if it looks good. </div>
            </Row>
            <Row className="margin-bottom" style={{padding: 1}} >
              <div className="int-ctr" > 3. Download. </div>
            </Row>
            <Row className="margin-bottom" style={{padding: 1}} >
              <div className="int-ctr" > 4. 3d Print! </div>
            </Row>
            <Row>
              <Col sm={12} md={12} className="margin-bottom" hidden={!this.state.stlUrl || this.state.submitted === 0}>
                <Button className="input-pad btn btn-success" disabled={this.state.loading} onClick={this.download}>Download .STL File</Button>
              </Col>
              <Col sm={8} md={8}>
                <input className="input-pad" disabled={this.state.loading} type="text" name="name" placeholder="Enter Name" value={this.state.name} onChange={this.input} ref={(el) => {this.inputRef = el}} />
              </Col>
              <Col sm={4} md={4}>
                <Button className="input-pad" disabled={this.state.loading} onClick={this.submit}>{this.state.loading ? 'Loading' : this.state.submitted > 0 ? 'Submit Again' : 'Submit'}</Button>
              </Col>
            </Row>
          </Container>

          <Button className="btn btn-warning float" onClick={this.scrollToBottom} hidden={!this.isMobile()}>Get Started 👇</Button>
        </header>
      </div>
    );
  }
}

export default App;
