pragma solidity ^0.5.1;

contract escrow {
    address payable seller;
    address payable buyer;
    uint public price;
    uint public pay;
    uint public number;
    string public state;
    event test_value(uint256 indexed value1);

    constructor(uint _price) public payable {  // 생성자
        seller = msg.sender;                   // 컨트랙트 호출한 사람이 판매자
        price = _price;                        // 물건값을 입력값으로 받음
        pay = price*2;                         // 캐쉬백 개념 : 구매자에게 2배로 받아야함
        state = "start";
        number = 0;                            // 송장번호
        emit const1();
    }
    // 시간제한은 웹에서 구현해야 될 듯.


    function sayHello() public pure returns(string memory) {
        return "hello";
    }
    
    function getState() public view returns(string memory) {
        return state;
    }
    
    function getNumber() public view returns(uint) {
        return number;
    }
    
    function getPrice() public view returns(uint) {
        return price;
    }
    
    function getPay() public view returns(uint) {
        return pay;
    }
    
    function purchase_request() public payable                // 구매요청
    {
        emit test_value(msg.value);
        // require(_pay == pay && equal(state,"start"));    // 구매자가 입력값으로 물건값 2배 (pay)를 지불하고, 상태가 start여야함
        require(msg.value == pay && equal(state,"start"));    // 구매자가 입력값으로 물건값 2배 (pay)를 지불하고, 상태가 start여야함
        
        // keccak256(state) == keccak256("start"));
        buyer = msg.sender;                                   // 메소드 호출한 사람이 구매자
        state = "processing";                                 // 구매중으로 바뀜
        emit p_request();
    }
    function input_number(uint _number) public{               // 송장번호 입력
      require(msg.sender == seller);                          // 판매자만 호출가능
      number = _number;
    }
    function buyer_receive(uint _number) public payable             // 물건 수령 완료
    {
        require(msg.sender == buyer && equal(state, "processing")); // 구매자만 호출가능, 구매중 상태여야함
        // keccak256(state) == keccak256("processing"));
        if(number !=0){require(number == _number);}                 // 판매자가 송장번호를 입력했으면, 송장번호 입력이 필요함
        state = "success";                                          // 거래 완료
        buyer.transfer(price);                                      // 구매자에게 2배에서 남은 물건값을 돌려줌(캐시백)
        seller.transfer(address(this).balance);                     // 혹시라도 컨트랙트 account에 남은 이더가 있으면, 판매자에게 송금
        emit b_receive();
    }
    function transact_cancel() public payable                       // 거래취소
    {
        if(equal(state,"start")) {                                  // 거래 시작전 취소
          seller.transfer(address(this).balance);                   // 컨트랙트 account에 남은 돈을 판매자에게 전송
        }
        else if(equal(state,"processing")) {                        // 거래 중일 시
          buyer.transfer(2*price);                                  // 구매자가 입금한 금액 환불
          seller.transfer(address(this).balance);                   // 혹시라도 컨트랙트 account에 있는 금액 구매자에게 송금
        }
        state = "cancel";                                           // 거래 취소 상태
        emit t_cancel();
    }

    event const1();
    event p_request();
    event b_receive();
    event t_cancel();

// --------------------------------- string compare 이용 -------------------------------------
    function compare(string memory _a, string memory _b) private pure returns (int) {
        bytes memory a = bytes(_a);
        bytes memory b = bytes(_b);
        uint minLength = a.length;
        if (b.length < minLength) minLength = b.length;
        for (uint i = 0; i < minLength; i ++)
            if (a[i] < b[i])
                return -1;
            else if (a[i] > b[i])
                return 1;
        if (a.length < b.length)
            return -1;
        else if (a.length > b.length)
            return 1;
        else
            return 0;
    }
    function equal(string memory _a, string memory _b) private pure returns (bool) {
        return compare(_a, _b) == 0;
    }

}
