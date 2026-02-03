import { useReducer } from "react";

import { Flex } from "@chakra-ui/react";

import ConnectorConfiguration from "./components/ConnectorConfiguration/ConnectorConfiguration";
import S3ConnectorConfiguration from "./components/ConnectorConfiguration/S3ConnectorConfiguration";
import DestinationSelection from "./components/DestinationSelection/DestinationSelection";
import SourceSelection from "./components/SourceSelection/SourceSelection";
import { connectorFormReducer, initialState } from "./reducer";

const NewConnector = () => {
  const [state, dispatch] = useReducer(connectorFormReducer, initialState);

  const handleNext = () => dispatch({ type: "NEXT_STEP" });
  const handlePrevious = () => dispatch({ type: "PREVIOUS_STEP" });

  const handleStepClick = (stepId: number) => {
    // Allow navigation to previous steps only
    if (stepId <= state.currentStep) {
      dispatch({ type: "SET_STEP", step: stepId });
    }
  };

  const handleSourceSelect = (source: string) => {
    dispatch({ type: "SET_SOURCE", source });
    handleNext();
  };

  const handleDestinationSelect = (destination: string) => {
    dispatch({ type: "SET_DESTINATION", destination });
    handleNext();
  };

  const isStepCompleted = (stepId: number) => {
    switch (stepId) {
      case 1:
        return !!state.destination;
      case 2:
        return !!state.source;
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
        if (!state.destination) handleStepClick(1);
        return (
          <>
            {state.destination ? (
              <SourceSelection
                selectedSource={state.source}
                onSourceSelect={handleSourceSelect}
                handlePrevious={handlePrevious}
              />
            ) : (
              <Flex>Please Choose a Destination</Flex>
            )}
          </>
        );
      case 3: {
        if (!isStepCompleted(2)) return null;

        // Determine if this is an S3 connector based on source name
        const isS3Connector = state.source?.toLowerCase() === "amazons3";

        // Route to appropriate configuration component
        return isS3Connector ? (
          <S3ConnectorConfiguration
            state={state}
            handlePrevious={handlePrevious}
            mode="create"
          />
        ) : (
          <ConnectorConfiguration
            state={state}
            handlePrevious={handlePrevious}
            mode="create"
          />
        );
      }
      default:
        return null;
    }
  };

  return <Flex direction="column">{renderStepContent()}</Flex>;
};
export default NewConnector;
