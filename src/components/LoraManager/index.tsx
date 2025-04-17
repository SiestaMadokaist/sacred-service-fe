import { AxiosInstance } from "axios"
import { FromHTTP } from "./from-http"
import { FromS3 } from "./from-s3"

export interface ILoraManager {
  computeAPI: AxiosInstance
}
export const LoraManager = (props: ILoraManager): JSX.Element => {
  return (<div className="w-100 h-100">
    <FromHTTP computeAPI={props.computeAPI} />
    <FromS3 computeAPI={props.computeAPI} />
  </div>)
}