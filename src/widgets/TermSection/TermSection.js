import React, {Fragment} from 'react'
import TextOverLineSubtitle from "../TextOverLineSubtitle/TextOverLineSubtitle";
import Layout from "../../assets/layouts";
import Text from "../../assets/text-combos";

export default function TermSection({title, lines, extras = {}}){

  const Lines = () => lines.map((cmd, i) => (
    <Text.Code key={i} chill>{cmd}</Text.Code>
  ));

  return(
    <Fragment>
      <TextOverLineSubtitle text={title}/>
      <Layout.BigCodeViewer {...extras}>
        <Lines/>
      </Layout.BigCodeViewer>
    </Fragment>
  )
}