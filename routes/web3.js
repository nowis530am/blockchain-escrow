import express from "express";
import Web3 from "web3";
var router = express.Router();

let web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
// var proofContract = web3.eth.contract([
//   {
//     constant: false,
//     inputs: [{ name: "fileHash", type: "string" }],
//     name: "get",
//     outputs: [{ name: "timestamp", type: "uint256" }, { name: "owner", type: "string" }],
//     payable: false,
//     type: "function"
//   },
//   {
//     constant: false,
//     inputs: [{ name: "owner", type: "string" }, { name: "fileHash", type: "string" }],
//     name: "set",
//     outputs: [],
//     payable: false,
//     type: "function"
//   },
//   {
//     anonymous: false,
//     inputs: [
//       { indexed: false, name: "status", type: "bool" },
//       { indexed: false, name: "timestamp", type: "uint256" },
//       { indexed: false, name: "owner", type: "string" },
//       { indexed: false, name: "fileHash", type: "string" }
//     ],
//     name: "logFileAddedStatus",
//     type: "event"
//   }
// ]);
// var proof = proofContract.at("0x57da6aee3eb32c7c9192d52e374f05a12d449ff0");

const abi = [
	{
		"constant": false,
		"inputs": [],
		"name": "purchase_request",
		"outputs": [],
		"payable": true,
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [],
		"name": "transact_cancel",
		"outputs": [],
		"payable": true,
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "pay",
		"outputs": [
			{
				"name": "",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [
			{
				"name": "_number",
				"type": "uint256"
			}
		],
		"name": "buyer_receive",
		"outputs": [],
		"payable": true,
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "number",
		"outputs": [
			{
				"name": "",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [
			{
				"name": "_number",
				"type": "uint256"
			}
		],
		"name": "input_number",
		"outputs": [],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "price",
		"outputs": [
			{
				"name": "",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "state",
		"outputs": [
			{
				"name": "",
				"type": "string"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "sayHello",
		"outputs": [
			{
				"name": "",
				"type": "string"
			}
		],
		"payable": false,
		"stateMutability": "pure",
		"type": "function"
	},
	{
		"inputs": [
			{
				"name": "_price",
				"type": "uint256"
			}
		],
		"payable": true,
		"stateMutability": "payable",
		"type": "constructor"
	},
	{
		"anonymous": false,
		"inputs": [],
		"name": "const1",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [],
		"name": "p_request",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [],
		"name": "b_receive",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [],
		"name": "t_cancel",
		"type": "event"
	}
];

const receiveAddress = "0xCB8cFEf5b3b59096e3c96FdBC9365C370927c622";

// web3
router.get("/purchase_request", async function(req, res, next) {
  // geth 연결 확인
  try {
    await web3.eth.net.isListening();
    console.log("connected");
  } catch (e) {
    console.log("Not Connected")
  }

  var address = await web3.eth.getAccounts();
  var balance = await web3.utils.fromWei(await web3.eth.getBalance(address[0]), "ether");

  const contract = new web3.eth.Contract(abi, receiveAddress);
  let result = await contract.methods.purchase_request().call();
  console.log(result);
  result = await contract.methods.sayHello().call();
  console.log(result);

  res.status(200).json({
    balance: balance
  });
});

module.exports = router;
