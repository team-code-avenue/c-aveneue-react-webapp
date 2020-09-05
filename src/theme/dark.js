import AntdButton from 'antd/Button';
import styled from 'styled-components';

const Button = styled(props => <AntdButton {...props} />)`
    padding: ${props => props.theme.buton.padding[props.size]};
    
`;