function xvm_call(

    bytes calldata context,
    bytes calldata to,
    bytes calldata input,

) external returns (bool success, bytes memory data);