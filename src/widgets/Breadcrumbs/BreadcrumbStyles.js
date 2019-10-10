import styled from "styled-components";

const Container = styled.div`
  position: absolute;
  bottom: 14px;
  left: 24px;
  display: inline-flex;
  z-index: 10;
`;

const Crumb = styled.p`
  font-size: 18px;
  text-decoration: none;
  font-weight: normal;
`;

const Slash = styled(Crumb)`
  margin: 0 6px;
`;

const S = { Container, Crumb, Slash };
export default S;