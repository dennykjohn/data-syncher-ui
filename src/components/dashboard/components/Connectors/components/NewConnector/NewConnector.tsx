import { useReducer } from "react";

import { Flex } from "@chakra-ui/react";

import ConnectorConfiguration from "./components/ConnectorConfiguration/ConnectorConfiguration";
import DestinationSelection from "./components/DestinationSelection/DestinationSelection";
import SourceSelection from "./components/SourceSelection/SourceSelection";
import { connectorFormReducer, initialState } from "./reducer";

const NewConnector = () => {
  const [state, dispatch] = useReducer(connectorFormReducer, initialState);

  const handleNext = () => {
    dispatch({ type: "NEXT_STEP" });
  };

  const handlePrevious = () => {
    dispatch({ type: "PREVIOUS_STEP" });
  };

  const handleStepClick = (stepId: number) => {
    // Allow navigation to previous steps only
    if (stepId <= state.currentStep) {
      dispatch({ type: "SET_STEP", step: stepId });
    }
  };

  const handleSourceSelect = (source: any) => {
    dispatch({ type: "SET_SOURCE", source });
    handleNext();
  };

  const handleDestinationSelect = (destination: any) => {
    dispatch({ type: "SET_DESTINATION", destination });
    handleNext();
  };

  const handleConfigurationChange = (field: string, value: any) => {
    dispatch({ type: "UPDATE_CONFIGURATION", field, value });
  };

  const isStepCompleted = (stepId: number) => {
    switch (stepId) {
      case 1:
        return !!state.source;
      case 2:
        return !!state.destination;
      case 3:
        return Object.keys(state.configuration).length > 0;
      default:
        return false;
    }
  };

  const renderStepContent = () => {
    switch (state.currentStep) {
      case 1:
        return (
          <DestinationSelection
            selectedDestination={state.destination}
            onDestinationSelect={handleDestinationSelect}
          />
        );
      case 2:
        return (
          <SourceSelection
            selectedSource={state.source}
            onSourceSelect={handleSourceSelect}
          />
        );

      case 3:
        return (
          <ConnectorConfiguration
            source={state.source}
            destination={state.destination}
            configuration={state.configuration}
            onConfigurationChange={handleConfigurationChange}
          />
        );
      default:
        return null;
    }
  };

  return <Flex direction="column">{renderStepContent()}</Flex>;
};
export default NewConnector;
